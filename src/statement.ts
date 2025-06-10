import { Comments } from "./comment";
import { generatePostgreSQLCommentStatements } from "./statement-postgresql";
import { generateMySQLCommentStatements } from "./statement-mysql";

export type DatabaseProvider = "postgresql" | "mysql";

export const generateCommentStatements = (
  comments: Comments,
  provider: DatabaseProvider = "postgresql",
): string[] => {
  switch (provider) {
    case "mysql":
      return generateMySQLCommentStatements(comments);
    case "postgresql":
    default:
      return generatePostgreSQLCommentStatements(comments);
  }
};
