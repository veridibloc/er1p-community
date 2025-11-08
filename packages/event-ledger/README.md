# @er1p/event-ledger

Isomorphic event ledger functionality for ER1P blockchain interactions. This package provides a robust system for dispatching and fetching events on the Signum blockchain, enabling decentralized event-driven applications.

## Features

- Dispatch events to the blockchain with automatic fee calculation
- Fetch confirmed and pending events with flexible filtering
- Type-safe event validation using Valibot schemas
- Built-in event registry system for custom event types
- Support for both payment and message-based transactions
- Pagination support for large event datasets
- SRC44 standard compliance for event descriptors

## Installation

```bash
npm install @er1p/event-ledger
# or
bun add @er1p/event-ledger
# or
yarn add @er1p/event-ledger
```

## Quick Start

### Initialize the Event Ledger

```typescript
import { LedgerClientFactory } from "@signumjs/core";
import { EventLedger } from "@er1p/event-ledger";

// Create a Signum ledger instance
const ledger = LedgerClientFactory.createClient({
  nodeHost: "https://your-signum-node.com",
});

// Create an event ledger instance
const eventLedger = new EventLedger(ledger);
```

### Dispatch an Event

```typescript
import { generateMasterKeys, Crypto } from "@signumjs/crypto";
import { NodeJSCryptoAdapter } from "@signumjs/crypto/adapters";
import { RaceCreatedEvent } from "@er1p/event-ledger";

// Initialize the crypto adapter for Node.js
Crypto.init(new NodeJSCryptoAdapter());

// Create your event
const raceEvent = new RaceCreatedEvent({
  id: "12345678901234567890",
  name: "Mountain Ultra Marathon",
  description: "A challenging 100km mountain race",
  directorId: "98765432109876543210",
  maxParticipants: 100,
  latitude: 47.5596,
  longitude: 7.5886,
  checkpoints: [
    {
      id: "cp1",
      name: "Start",
      latitude: 47.5596,
      longitude: 7.5886,
      distanceKilometer: 0,
      elevationGain: 0,
      elevationLoss: 0,
      type: "in",
    },
    {
      id: "cp2",
      name: "Summit",
      latitude: 47.565,
      longitude: 7.592,
      distanceKilometer: 50,
      elevationGain: 2000,
      elevationLoss: 500,
      type: "split",
    },
  ],
  dateTime: new Date("2025-06-15T08:00:00Z"),
  durationMinutes: 1200,
  lengthKilometer: 100,
  bannerLogoUrl: "https://example.com/banner.jpg",
  imageLogoUrl: "https://example.com/logo.jpg",
});

// Validate the event before dispatching
const errors = raceEvent.validate();
if (errors.length > 0) {
  console.error("Validation errors:", errors);
  throw new Error("Invalid event");
}

// Sender's keys
const senderKeys = generateMasterKeys("your passphrase here");

// Recipient's public key
const recipientPublicKey = "recipient_public_key_here";

// Dispatch the event
try {
  const transactionId = await eventLedger.dispatch({
    event: raceEvent,
    senderKeys,
    recipientPublicKey,
    // Optional: include an amount to send with the event
    // amount: Amount.fromSigna(10)
  });

  console.log("Event dispatched! Transaction ID:", transactionId);
} catch (error) {
  console.error("Failed to dispatch event:", error);
}
```

### Fetch Events

```typescript
import { EventName } from "@er1p/event-ledger";

// Fetch all events between sender and recipient
const events = await eventLedger.fetchEvents({
  senderId: "12345678901234567890",
  recipientId: "98765432109876543210",
  firstIndex: 0,
  lastIndex: 100,
});

console.log(`Found ${events.length} events`);

// Fetch events filtered by name
const raceCreatedEventName = new EventName("race_created", 1);
const raceEvents = await eventLedger.fetchEvents({
  senderId: "12345678901234567890",
  eventNames: [raceCreatedEventName],
});

// Fetch events within a block height range
const eventsInRange = await eventLedger.fetchEvents({
  recipientId: "98765432109876543210",
  startBlockHeight: 1000000,
  endBlockHeight: 1001000,
});
```

### Fetch Pending (Unconfirmed) Events

```typescript
// Fetch pending events
const pendingEvents = await eventLedger.fetchPendingEvents({
  recipientId: "98765432109876543210",
});

console.log(`Found ${pendingEvents.length} pending events`);
```

## Creating Custom Events

You can create your own custom event types by extending `AbstractLedgerEvent`:

```typescript
import {
  AbstractLedgerEvent,
  LedgerEventRegistry,
  EventName,
} from "@er1p/event-ledger";
import { src44 } from "@signumjs/standards";
import * as v from "valibot";
import type { Transaction } from "@signumjs/core";

// Define your payload type
interface MyEventPayload {
  title: string;
  value: number;
  timestamp: Date;
}

// Define validation schema
const MyEventSchema = v.object({
  title: v.pipe(v.string(), v.nonEmpty()),
  value: v.pipe(v.number(), v.minValue(0)),
  timestamp: v.date(),
});

// Create your event class
export class MyCustomEvent extends AbstractLedgerEvent<MyEventPayload> {
  public static readonly Name = "my_custom_event";
  public static readonly Version = 1;

  constructor(payload: MyEventPayload, tx?: Transaction) {
    super(MyCustomEvent.Name, MyCustomEvent.Version, payload, tx);
  }

  validate(): string[] {
    try {
      v.parse(MyEventSchema, this.payload);
      return [];
    } catch (error) {
      if (error instanceof v.ValiError) {
        return error.issues.map((issue) => issue.message);
      }
      return [error.message];
    }
  }

  protected descriptorImpl(
    builder: src44.DescriptorDataBuilder,
  ): src44.DescriptorData {
    return builder
      .setDescription(`Custom Event: ${this.payload.title}`)
      .setType("app")
      .setCustomField("title", this.payload.title)
      .setCustomField("value", this.payload.value.toString())
      .setCustomField("timestamp", this.payload.timestamp.getTime().toString())
      .build();
  }

  static fromTransaction(
    tx: Transaction,
    descriptor: src44.DescriptorData,
  ): MyCustomEvent {
    return new MyCustomEvent(
      {
        title: (descriptor.getCustomField("title") as string) || "",
        value: parseFloat(
          (descriptor.getCustomField("value") as string) || "0",
        ),
        timestamp: new Date(
          parseInt((descriptor.getCustomField("timestamp") as string) || "0"),
        ),
      },
      tx,
    );
  }
}

// Register your event
LedgerEventRegistry.getInstance().register(
  MyCustomEvent,
  new EventName(MyCustomEvent.Name, MyCustomEvent.Version),
);
```

## API Reference

### EventLedger

#### Constructor

```typescript
constructor(ledger: Ledger, eventRegistry?: LedgerEventRegistry)
```

#### Methods

##### `dispatch(args: DispatchArgs): Promise<TransactionId>`

Dispatches an event to the blockchain.

**Parameters:**

- `event`: The event to dispatch
- `senderKeys`: Sender's signing keys
- `recipientPublicKey`: Recipient's public key
- `amount` (optional): Amount to send with the event

**Returns:** Transaction ID

##### `fetchEvents(args: FetchEventsArgs): Promise<LedgerEvent[]>`

Fetches confirmed events from the blockchain.

**Parameters:**

- `recipientId` (optional): Filter by recipient
- `senderId` (optional): Filter by sender
- `eventNames` (optional): Filter by event names
- `startBlockHeight` (optional): Start block for filtering
- `endBlockHeight` (optional): End block for filtering
- `firstIndex` (optional): Pagination start (default: 0)
- `lastIndex` (optional): Pagination end (default: 500)

**Returns:** Array of ledger events

##### `fetchPendingEvents(args: FetchPendingEventsArgs): Promise<LedgerEvent[]>`

Fetches unconfirmed events from the transaction pool.

**Parameters:**

- `recipientId` (optional): Filter by recipient
- `senderId` (optional): Filter by sender
- `eventNames` (optional): Filter by event names

**Returns:** Array of pending ledger events

## Built-in Event Types

The package includes several pre-built event types:

- `RaceCreatedEvent` - For creating race events
- `CheckpointPassedEvent` - For recording checkpoint passages
- `ParticipantConfirmedEvent` - For confirming participant registration
- `ParticipantDisqualifiedEvent` - For disqualifying participants
- Generic race flow events via `createRaceFlowEvent()`

## Error Handling

The package throws `EventLedgerError` for blockchain-related errors:

```typescript
import { EventLedgerError } from "@er1p/event-ledger";

try {
  await eventLedger.dispatch({
    /* ... */
  });
} catch (error) {
  if (error instanceof EventLedgerError) {
    console.error("Ledger error:", error.message);
  }
}
```

## Constants

- `EventLedger.MAX_EVENTS_PER_PAGE` - Maximum events per fetch (500)
- `EventLedger.MAX_BLOCK_RANGE_SIZE` - Maximum block range size (50)

## Dependencies

This package requires:

- `@signumjs/core` - Signum blockchain client
- `@signumjs/crypto` - Cryptographic utilities
- `@signumjs/util` - Utility functions
- `@signumjs/standards` - SRC44 standard implementation

## License

MIT

## Contributing

Contributions are welcome! Please ensure all tests pass and code follows the project's style guidelines.
