/**
 * Represents an event name with its associated version.
 * Provides functionality to parse and format event names.
 */
export class EventName {
  constructor(
    public readonly name: string,
    public readonly version: number,
  ) {}

  /**
   * Converts the object into a string representation consisting of its name and version values.
   * @return {string} A string containing the object's name and version separated by an '@' symbol.
   */
  toString() {
    return `${this.name}@${this.version}`;
  }

  /**
   * Parses a string representing an event name in the format '<name>@<version>'.
   * Throws an error if the input does not match the required format.
   *
   * @param {string} name - The event name string to be parsed, expected in the format '<name>@<version>'.
   * @return {EventName} An EventName instance containing the type and version parsed from the input string.
   */
  static parse(name: string) {
    if (!/^\w+@\d+$/.test(name))
      throw new Error(
        "Invalid event name - requires '<name>@<version>' format",
      );

    const [type, version] = name.split("@");
    return new EventName(type!, Number(version));
  }

  /**
   * Parses the provided string using the EventName.parse method. If parsing fails, it safely returns null.
   *
   * @param {string} name - The string to be parsed.
   * @return {EventName|null} The parsed EventName instance if successful; otherwise, returns null.
   */
  static safeParse(name: string) {
    try {
      return EventName.parse(name);
    } catch (error) {
      return null;
    }
  }
}
