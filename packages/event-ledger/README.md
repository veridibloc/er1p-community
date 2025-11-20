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

## Building Custom Event Systems

The event-ledger is designed to be extended for custom blockchain applications beyond racing:

### Example: Supply Chain Events

```typescript
import { AbstractLedgerEvent, EventName } from '@er1p-community/event-ledger';
import * as v from 'valibot';

interface ShipmentPayload {
  trackingId: string;
  origin: string;
  destination: string;
  timestamp: Date;
}

const ShipmentSchema = v.object({
  trackingId: v.pipe(v.string(), v.nonEmpty()),
  origin: v.string(),
  destination: v.string(),
  timestamp: v.date()
});

export class ShipmentEvent extends AbstractLedgerEvent<ShipmentPayload> {
  static readonly Name = "shipment_created";
  static readonly Version = 1;

  constructor(payload: ShipmentPayload, tx?: Transaction) {
    super(ShipmentEvent.Name, ShipmentEvent.Version, payload, tx);
  }

  validate(): string[] {
    try {
      v.parse(ShipmentSchema, this.payload);
      return [];
    } catch (error) {
      if (error instanceof v.ValiError) {
        return error.issues.map(i => i.message);
      }
      return [error.message];
    }
  }

  // ... implement descriptorImpl and fromTransaction
}
```

### Example: NFT Minting Events

```typescript
interface NFTMintPayload {
  tokenId: string;
  metadata: {
    name: string;
    image: string;
    attributes: Record<string, any>;
  };
}

export class NFTMintEvent extends AbstractLedgerEvent<NFTMintPayload> {
  // ... implementation
}
```

## Advanced Usage

### Batch Event Dispatching

Dispatch multiple events efficiently:

```typescript
const events = [event1, event2, event3];

for (const event of events) {
  await eventLedger.dispatch({
    event,
    senderKeys,
    recipientPublicKey
  });
}
```

### Event Filtering

Fetch events with complex filters:

```typescript
// Get events in specific block range
const eventsInRange = await eventLedger.fetchEvents({
  recipientId: "12345678901234567890",
  startBlockHeight: 1000000,
  endBlockHeight: 1001000,
  eventNames: [
    new EventName("race_created", 1),
    new EventName("race_started", 1)
  ]
});

// Paginate through large result sets
const firstPage = await eventLedger.fetchEvents({
  senderId: "12345678901234567890",
  firstIndex: 0,
  lastIndex: 100
});

const secondPage = await eventLedger.fetchEvents({
  senderId: "12345678901234567890",
  firstIndex: 100,
  lastIndex: 200
});
```

### Working with Pending Events

Monitor unconfirmed transactions:

```typescript
// Fetch pending events
const pending = await eventLedger.fetchPendingEvents({
  recipientId: "12345678901234567890"
});

// Wait for confirmation
const checkConfirmation = async (txId: string) => {
  // Poll until transaction is confirmed
  while (true) {
    const confirmed = await eventLedger.fetchEvents({
      // Filter by transaction ID
    });
    if (confirmed.length > 0) break;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};
```

## Contributing

We welcome contributions! Whether you're fixing bugs, adding new event types, or improving documentation, here's how to get involved:

### Bug Reports

Found a bug? [Open an issue](https://github.com/veridibloc/er1p-community/issues) with:
- Description of the issue
- Code snippet that reproduces the problem
- Expected vs. actual behavior
- Blockchain transaction IDs (if applicable)

### Feature Requests

Have an idea? [Start a discussion](https://github.com/veridibloc/er1p-community/discussions) or open an issue describing:
- The feature you'd like
- Your use case
- How it fits with the existing API

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-event-type`
3. **Make your changes**:
   - Add new event types in `src/events/`
   - Update exports in `src/index.ts`
   - Add tests if applicable
4. **Ensure code quality**:
   - Run type checking: `bun run typecheck`
   - Test with real blockchain (testnet)
   - Validate events work end-to-end
5. **Update documentation**:
   - Add examples to README
   - Document new event types
   - Update JSDoc comments
6. **Commit**: `git commit -m "feat: add new event type"`
7. **Push and create a PR**

### Development Guidelines

- **Event Validation**: All events must have Valibot schemas
- **Backward Compatibility**: Don't break existing event formats
- **SRC44 Compliance**: Follow Signum standards for descriptors
- **TypeScript**: Maintain 100% type safety
- **Testing**: Test on Signum testnet before mainnet
- **Documentation**: Document all public APIs with JSDoc
- **Error Handling**: Use `EventLedgerError` for blockchain errors

### Areas We Need Help With

- 🧪 **Testing** - Unit and integration tests for all event types
- 📚 **Documentation** - More examples and tutorials
- 🚀 **Event Types** - New built-in event types for common use cases
- ⚡ **Performance** - Batch dispatch optimization
- 🔍 **Event Indexing** - Better filtering and search capabilities
- 🌐 **Multi-chain Support** - Support for other Signum-compatible chains
- 📦 **Validation** - Enhanced schema validation helpers

### Adding New Built-in Events

To add a new built-in event type:

1. Create event class in `src/events/` (e.g., `myEvent.ts`)
2. Implement `AbstractLedgerEvent` interface
3. Add Valibot schema for validation
4. Register in `src/events/index.ts`
5. Export from `src/index.ts`
6. Add example to README
7. Test thoroughly

## Publishing

This package is published to npm as `@er1p-community/event-ledger`.

To publish a new version:

```bash
# Update version in package.json
# Build the package
bun run build

# Publish (maintainers only)
npm publish
```

## Testing

### Unit Tests

```bash
bun test
```

### Integration Testing on Testnet

```typescript
import { LedgerClientFactory } from '@signumjs/core';

// Use Signum testnet
const ledger = LedgerClientFactory.createClient({
  nodeHost: 'https://testnet.signum.network'
});

const eventLedger = new EventLedger(ledger);
// Test your events on testnet before mainnet
```
