import { Comments } from "./comment";

export const generatePostgreSQLCommentStatements = (
  comments: Comments,
): string[] => {
  const commentStatements: string[] = [];

  for (const tableName in comments) {
    const { table, columns } = comments[tableName];

    commentStatements.push(`-- ${tableName} comments`);
    if (table) {
      // ON TABLE
      commentStatements.push(
        `COMMENT ON TABLE ${joinNames(table.schema, table.tableName)} IS ${toStringLiteral(table.comment)};`,
      );
    }

    if (columns) {
      for (const column of columns) {
        // ON COLUMN
        commentStatements.push(
          `COMMENT ON COLUMN ${joinNames(column.schema, column.tableName, column.columnName)} IS ${toStringLiteral(column.comment)};`,
        );
      }
    }

    commentStatements.push("");
  }

  return commentStatements;
};

const toStringLiteral = (str?: string) => {
  if (str) {
    const strValue = `'${escapeString(str)}'`;
    return strValue.includes("\\") ? "E" + strValue : strValue;
  } else {
    return "NULL";
  }
};

const escapeString = (str: string) => {
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
};

const joinNames = (
  schema: string | undefined,
  tableName: string,
  columnName?: string,
) => {
  let name = "";
  if (schema) {
    name += `"${schema}".`;
  }
  name += `"${tableName}"`;
  if (columnName) {
    name += `."${columnName}"`;
  }
  return name;
};
