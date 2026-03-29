import {AbstractLedgerEvent} from "./abstract-ledger-event";
import {
    type Ledger,
    type Transaction,
    type TransactionId,
} from "@signumjs/core";
import {src44} from "@signumjs/standards";
import {LedgerEventRegistry} from "./ledger-event-registry";
import * as v from "valibot";
import {EventName} from "../event-name";
import {Amount} from "@signumjs/util";
import {
    Validators,
    Src44FieldNames,
    validateWithSchema,
} from "./event-helpers";
import {
    deserializeCheckpoints,
    serializeCheckpoints,
    splitCheckpointData,
} from "./checkpoints-helpers.ts";
import type {Race, Checkpoint} from "../race.types.ts";
import type {LedgerEventContext} from "../ledger-event.types.ts";

const RaceCreatedSchema = v.object({
    id: v.pipe(
        v.string(),
        v.nonEmpty("Race/Account Id is required"),
        Validators.AccountIdAction,
    ),
    name: v.pipe(v.string(), v.nonEmpty()),
    description: v.pipe(v.string(), v.nonEmpty()),
    directorId: v.pipe(v.string(), v.nonEmpty()),
    maxParticipants: v.pipe(v.number(), v.minValue(1)),
    latitude: Validators.LatitudeSchema,
    longitude: Validators.LongitudeSchema,
    checkpoints: v.array(
        v.object({
            id: v.pipe(v.string(), v.nonEmpty()),
            name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(24)),
            latitude: Validators.LatitudeSchema,
            longitude: Validators.LongitudeSchema,
            distanceKilometer: v.pipe(v.number(), v.minValue(0)),
            elevationGain: v.pipe(v.number(), v.minValue(0)),
            elevationLoss: v.pipe(v.number(), v.minValue(0)),
            type: v.picklist(["split", "in", "out"]),
        }),
    ),
    dateTime: v.date(),
    durationMinutes: v.pipe(v.number(), v.minValue(0.1)),
    lengthKilometer: v.pipe(v.number(), v.minValue(0.1)),
    bannerLogoUrl: Validators.OptionalUrl,
    imageLogoUrl: Validators.OptionalUrl,
});

export class RaceCreatedEvent extends AbstractLedgerEvent<Race> {
    public static readonly Name = "race_created";
    public static readonly Version = 1;

    constructor(payload: Race, tx?: Transaction) {
        super(RaceCreatedEvent.Name, RaceCreatedEvent.Version, payload, tx);
    }

    validate(): string[] {
        return validateWithSchema(RaceCreatedSchema, this.payload);
    }

    private buildDescriptor(
        checkpointValue: string,
    ): src44.DescriptorData {
        const args = this.payload;
        return src44.DescriptorDataBuilder.create(
            new EventName(this.name, this.version).toString(),
        )
            .setDescription(args.description)
            .setType("biz")
            .setCustomField(Src44FieldNames.RACE_DIRECTOR, args.directorId)
            .setCustomField(Src44FieldNames.RACE_NAME, args.name)
            .setCustomField(
                Src44FieldNames.MAX_PARTICIPANTS,
                args.maxParticipants.toString(),
            )
            .setCustomField(Src44FieldNames.LATITUDE, args.latitude.toString())
            .setCustomField(Src44FieldNames.LONGITUDE, args.longitude.toString())
            .setCustomField(Src44FieldNames.CHECKPOINTS, checkpointValue)
            .setCustomField(
                Src44FieldNames.DATE_TIME,
                args.dateTime.getTime().toString(),
            )
            .setCustomField(
                Src44FieldNames.MAX_DURATION_MINUTES,
                args.durationMinutes.toString(),
            )
            .setCustomField(
                Src44FieldNames.LENGTH_KM,
                args.lengthKilometer.toString(),
            )
            .setCustomField(
                Src44FieldNames.BANNER_LOGO,
                args.bannerLogoUrl.toString(),
            )
            .setCustomField(Src44FieldNames.IMAGE_LOGO, args.imageLogoUrl.toString())
            .build();
    }

    protected async descriptorImpl(
        _builder: src44.DescriptorDataBuilder,
        context: LedgerEventContext,
    ): Promise<src44.DescriptorData> {
        const serializedCheckpoints = serializeCheckpoints(this.payload.checkpoints);

        // Try to fit everything in a single descriptor
        try {
            return this.buildDescriptor(serializedCheckpoints);
        } catch (e: any) {
            if (!e.message.includes("Maximum length of 1000 bytes allowed")) {
                throw e;
            }
        }

        // Send overflow checkpoint chunks as linked plain-message transactions
        const chunks = splitCheckpointData(serializedCheckpoints, 800);
        let nextTxId: string | undefined = undefined;

        // Send in reverse order so each chunk can reference the next
        for (let i = chunks.length - 1; i >= 0; i--) {
            const builder = src44.DescriptorDataBuilder.create("checkpoint_data@1")
                .setType("biz")
                .setId(context.recipientId)
                .setCustomField(Src44FieldNames.CP_OVERFLOW_ORDER, (i + 1).toString())
                .setCustomField(Src44FieldNames.CHECKPOINTS, chunks[i]!);

            if (nextTxId) {
                builder.setCustomField(Src44FieldNames.CP_OVERFLOW_NEXT, nextTxId);
            }

            const descriptor = builder.build();
            const message = descriptor.stringify();
            const fee = RaceCreatedEvent.calculateOverflowFee(message.length);

            const result = (await context.ledger.message.sendMessage({
                recipientPublicKey: context.recipientPublicKey,
                recipientId: context.recipientId,
                feePlanck: fee.getPlanck(),
                deadline: 60,
                senderPrivateKey: context.senderKeys.signPrivateKey,
                senderPublicKey: context.senderKeys.publicKey,
                message,
                messageIsText: true,
            })) as TransactionId;

            nextTxId = result.transaction;
        }

        return this.buildDescriptor(`ref:${nextTxId}`);
    }

    private static calculateOverflowFee(messageSize: number): Amount {
        const MinFee = 0.01;
        const MaxFee = 0.06;
        const MinSize = 190;
        const MaxSize = 1000;
        const totalSize = 190 + messageSize;
        const clampedSize = Math.max(MinSize, Math.min(MaxSize, totalSize));
        const sizeRatio = (clampedSize - MinSize) / (MaxSize - MinSize);
        const fee = MinFee + sizeRatio * (MaxFee - MinFee);
        return Amount.fromSigna(Math.min(Math.round(fee * 1000) / 1000, MaxFee));
    }

    /**
     * Creates a RaceCreatedEvent from a transaction.
     * If the checkpoint data references overflow transactions, uses the ledger to resolve them.
     */
    static async fromTransaction(
        tx: Transaction,
        descriptor: src44.DescriptorData,
        ledger: Ledger,
    ): Promise<RaceCreatedEvent> {
        const d = descriptor;
        const checkpointField = (d.getCustomField(Src44FieldNames.CHECKPOINTS) as string) || "";

        let checkpoints: Checkpoint[];
        if (checkpointField.startsWith("ref:")) {
            checkpoints = await RaceCreatedEvent.resolveOverflowChain(
                checkpointField.slice(4),
                ledger,
            );
        } else {
            checkpoints = deserializeCheckpoints(checkpointField);
        }

        return new RaceCreatedEvent(
            {
                id: tx.recipient ?? "",
                name: (d.getCustomField(Src44FieldNames.RACE_NAME) as string) || "",
                description: d.description,
                directorId:
                    (d.getCustomField(Src44FieldNames.RACE_DIRECTOR) as string) || "",
                maxParticipants: parseInt(
                    (d.getCustomField(Src44FieldNames.MAX_PARTICIPANTS) as string) || "0",
                ),
                latitude: parseFloat(
                    (d.getCustomField(Src44FieldNames.LATITUDE) as string) || "0",
                ),
                longitude: parseFloat(
                    (d.getCustomField(Src44FieldNames.LONGITUDE) as string) || "0",
                ),
                checkpoints,
                dateTime: new Date(
                    parseInt(
                        (d.getCustomField(Src44FieldNames.DATE_TIME) as string) || "0",
                    ),
                ),
                durationMinutes: parseInt(
                    (d.getCustomField(Src44FieldNames.MAX_DURATION_MINUTES) as string) ||
                    "0",
                ),
                lengthKilometer: parseFloat(
                    (d.getCustomField(Src44FieldNames.LENGTH_KM) as string) || "0",
                ),
                bannerLogoUrl:
                    (d.getCustomField(Src44FieldNames.BANNER_LOGO) as string) || "",
                imageLogoUrl:
                    (d.getCustomField(Src44FieldNames.IMAGE_LOGO) as string) || "",
            },
            tx,
        );
    }

    /**
     * Follows the {@link Src44FieldNames.CP_OVERFLOW_NEXT} chain of linked overflow transactions and reassembles checkpoint data.
     */
    private static async resolveOverflowChain(
        startTxId: string,
        ledger: Ledger,
    ): Promise<Checkpoint[]> {
        const checkpoints: Checkpoint[] = [];
        let currentTxId: string | null = startTxId;

        while (currentTxId) {
            const tx = await ledger.transaction.getTransaction(currentTxId);
            const descriptor = src44.DescriptorData.parse(tx.attachment.message);
            const chunk = (descriptor.getCustomField(Src44FieldNames.CHECKPOINTS) as string) || "";

            if (chunk) {
                checkpoints.push(...deserializeCheckpoints(chunk));
            }

            currentTxId = (descriptor.getCustomField(Src44FieldNames.CP_OVERFLOW_NEXT) as string) || null;
        }

        return checkpoints;
    }
}

LedgerEventRegistry.getInstance().register(
    RaceCreatedEvent,
    new EventName(RaceCreatedEvent.Name, RaceCreatedEvent.Version),
);
