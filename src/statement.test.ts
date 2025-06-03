import { Comments } from "./comment";
import { generateCommentStatements } from "./statement";

describe("generateCommentStatements", () => {
  test("empty comments", () => {
    // ARRANGE
    const comments: Comments = {};

    // ACT
    const statements = generateCommentStatements(comments);

    // ASSERT
    expect(statements).toStrictEqual([]);
  });

  test("only table comment", () => {
    // ARRANGE
    const comments: Comments = {
      users: {
        table: {
          tableName: "users",
          comment: "ユーザーテーブル",
        },
        columns: [],
      },
    };

    // ACT
    const statements = generateCommentStatements(comments);

    // ASSERT
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'ユーザーテーブル';`,
      "",
    ]);
  });

  test("only column comments", () => {
    // ARRANGE
    const comments: Comments = {
      users: {
        table: undefined,
        columns: [
          {
            tableName: "users",
            columnName: "id",
            comment: "ユーザーID",
          },
          {
            tableName: "users",
            columnName: "name",
            comment: "ユーザー名",
          },
        ],
      },
    };

    // ACT
    const statements = generateCommentStatements(comments);

    // ASSERT
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON COLUMN "users"."id" IS 'ユーザーID';`,
      `COMMENT ON COLUMN "users"."name" IS 'ユーザー名';`,
      "",
    ]);
  });

  test("both table and column comments", () => {
    // ARRANGE
    const comments: Comments = {
      users: {
        table: {
          tableName: "users",
          comment: "ユーザーテーブル",
        },
        columns: [
          {
            tableName: "users",
            columnName: "id",
            comment: "ユーザーID",
          },
          {
            tableName: "users",
            columnName: "name",
            comment: "ユーザー名",
          },
        ],
      },
    };

    // ACT
    const statements = generateCommentStatements(comments);

    // ASSERT
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'ユーザーテーブル';`,
      `COMMENT ON COLUMN "users"."id" IS 'ユーザーID';`,
      `COMMENT ON COLUMN "users"."name" IS 'ユーザー名';`,
      "",
    ]);
  });

  test("multiple tables", () => {
    // ARRANGE
    const comments: Comments = {
      users: {
        table: {
          tableName: "users",
          comment: "ユーザーテーブル",
        },
        columns: [
          {
            tableName: "users",
            columnName: "id",
            comment: "ユーザーID",
          },
        ],
      },
      posts: {
        table: {
          tableName: "posts",
          comment: "投稿テーブル",
        },
        columns: [
          {
            tableName: "posts",
            columnName: "title",
            comment: "タイトル",
          },
        ],
      },
    };

    // ACT
    const statements = generateCommentStatements(comments);

    // ASSERT
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'ユーザーテーブル';`,
      `COMMENT ON COLUMN "users"."id" IS 'ユーザーID';`,
      "",
      "-- posts comments",
      `COMMENT ON TABLE "posts" IS '投稿テーブル';`,
      `COMMENT ON COLUMN "posts"."title" IS 'タイトル';`,
      "",
    ]);
  });

  test("comments with special characters", () => {
    // ARRANGE
    const comments: Comments = {
      users: {
        table: {
          tableName: "users",
          comment: "User's table",
        },
        columns: [
          {
            tableName: "users",
            columnName: "description",
            comment: "Line1\nLine2",
          },
        ],
      },
    };

    // ACT
    const statements = generateCommentStatements(comments);

    // ASSERT
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'User''s table';`,
      `COMMENT ON COLUMN "users"."description" IS E'Line1\\nLine2';`,
      "",
    ]);
  });

  test("treat empty comments as NULL", () => {
    // ARRANGE
    const comments: Comments = {
      users: {
        table: {
          tableName: "users",
          comment: "",
        },
        columns: [
          {
            tableName: "users",
            columnName: "id",
            comment: "",
          },
        ],
      },
    };

    // ACT
    const statements = generateCommentStatements(comments);

    // ASSERT
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS NULL;`,
      `COMMENT ON COLUMN "users"."id" IS NULL;`,
      "",
    ]);
  });
});
