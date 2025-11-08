export const Config = {
  NodeHost: process.env.NODE_HOST || "http://localhost:6876",
  StartBlock: Number(process.env.START_BLOCK) || 800_000,
  IsVerbose: process.env.VERBOSE === "true",
};
