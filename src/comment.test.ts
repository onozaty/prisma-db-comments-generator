import { AllTargets, Comments, createComments, diffComments } from "./comment";
import { Model } from "./parser";

describe("createComments", () => {
  test("empty", () => {
    // ARRANGE
    const models: Model[] = [];

    // ACT
    const comments = createComments(models, AllTargets, {
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // ASSERT
    expect(comments).toStrictEqual({});
  });

  test("normal", () => {
    // ARRANGE
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
      {
        dbName: "table2",
        fields: [{ dbName: "fieldA", documentation: "fieldA comment" }],
      },
    ];

    // ACT
    const comments = createComments(models, AllTargets, {
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // ASSERT
    expect(comments).toStrictEqual({
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });

  test("includeEnumInFieldComment", () => {
    // ARRANGE
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
    ];

    // ACT
    const comments = createComments(models, AllTargets, {
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: true,
    });

    // ASSERT
    expect(comments).toStrictEqual({
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment\nenum: enum1(A, B)",
          },
          {
            tableName: "table1",
            columnName: "field4",
            comment: "enum: enum2(A, B, C)",
          },
        ],
      },
    });
  });

  test("ignorePattern", () => {
    // ARRANGE
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
      {
        dbName: "table2",
        fields: [{ dbName: "fieldA", documentation: "fieldA comment" }],
      },
    ];

    // ACT
    const comments = createComments(models, AllTargets, {
      ignorePattern: /table1/,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // ASSERT
    expect(comments).toStrictEqual({
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });

  test("ignoreCommentPattern", () => {
    // ARRANGE
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
      {
        dbName: "table2",
        documentation: "table2 comment",
        fields: [{ dbName: "fieldA", documentation: "fieldA comment" }],
      },
    ];

    // ACT
    const comments = createComments(models, AllTargets, {
      ignorePattern: undefined,
      ignoreCommentPattern: /field1|table2/,
      includeEnumInFieldComment: false,
    });

    // ASSERT
    expect(comments).toStrictEqual({
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          { tableName: "table1", columnName: "field1", comment: "" },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });
});

describe("diffComments", () => {
  test("empty", () => {
    // ARRANGE
    const first: Comments = {};
    const second: Comments = {};

    // ACT
    const comments = diffComments(first, second);

    // ASSERT
    expect(comments).toStrictEqual({});
  });

  test("empty second", () => {
    // ARRANGE
    const first: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };
    const second: Comments = {};

    // ACT
    const comments = diffComments(first, second);

    // ASSERT
    expect(comments).toStrictEqual({
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
        ],
      },
      table2: {
        table: undefined,
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });

  test("first has columns only", () => {
    // ARRANGE
    const first: Comments = {
      table1: {
        table: undefined,
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
        ],
      },
    };
    const second: Comments = {};

    // ACT
    const comments = diffComments(first, second);

    // ASSERT
    expect(comments).toStrictEqual({
      table1: {
        table: undefined,
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
        ],
      },
    });
  });

  test("empty first", () => {
    // ARRANGE
    const first: Comments = {};
    const second: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };

    // ACT
    const comments = diffComments(first, second);

    // ASSERT
    expect(comments).toStrictEqual({});
  });

  test("same", () => {
    // ARRANGE
    const first: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };
    const second: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };

    // ACT
    const comments = diffComments(first, second);

    // ASSERT
    expect(comments).toStrictEqual({});
  });

  test("diff", () => {
    // ARRANGE
    const first: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment xxx",
          },
          { tableName: "table1", columnName: "field2", comment: "xxx" },
          { tableName: "table1", columnName: "field3", comment: "" },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "xxx" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };
    const second: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };

    // ACT
    const comments = diffComments(first, second);

    // ASSERT
    expect(comments).toStrictEqual({
      table1: {
        table: undefined,
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment xxx",
          },
          { tableName: "table1", columnName: "field2", comment: "xxx" },
          { tableName: "table1", columnName: "field3", comment: "" },
        ],
      },
      table2: { table: { tableName: "table2", comment: "xxx" }, columns: [] },
    });
  });
});
