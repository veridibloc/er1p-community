import {Amount} from "@signumjs/util";

/**
 * Calculates the transaction fee for a given message size.
 * @param messageSize
 */
export const calculateTransactionFee = (messageSize: number) : Amount => {

    const TxOverhead = 190;
    const MinSize = 190;
    const MaxSize = 1000;
    const AllowedFees = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    const totalSize = TxOverhead + messageSize;

    if (messageSize > MaxSize) {
        throw new Error(
            `Message size is too big - Got: ${messageSize}b Max is ${MaxSize}b`,
        );
    }

    const clampedSize = Math.max(MinSize, Math.min(MaxSize, totalSize));
    const sizeRatio = (clampedSize - MinSize) / (MaxSize - MinSize);
    const feeIndex = Math.min(
        Math.floor(sizeRatio * AllowedFees.length),
        AllowedFees.length - 1,
    );

    return Amount.fromSigna(AllowedFees[feeIndex]!);
}
