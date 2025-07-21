import { GraphQLClient } from "graphql-request";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  "https://your-graphql-endpoint.com/graphql";

const BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjakp0ZFdQaGhkUHlYU25SdSIsInJvbGUiOiJBRE1JTiIsImp0aSI6IjJjODBiMDI1YzY4MDZjNTBhMzQ1NzVjNyIsImlwQWRkcmVzcyI6IjE0My40NC4xOTIuMTQ3IiwibG9jYXRpb24iOiJDYWdheWFuIGRlIE9ybywgUGhpbGlwcGluZXMiLCJwbGF0Zm9ybSI6IjEydXd1UkNjWXAxY1dpWHpQWSIsImlhcCI6IjIwMjQtMTItMjNUMDQ6MjA6MTIuOTc4KzAwOjAwIiwidGVzdFBhc3MiOnRydWUsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MzQ5Mjc2NDMsImV4cCI6MTc2NjQ2MzY0M30.3bOWl4q2k4IzLJTpmTB2zlgvtxQAWy8fq9f2cWSIZD4";

export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Helper function for making GraphQL requests with error handling
export async function makeGraphQLRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const data = await graphqlClient.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error("GraphQL request failed:", error);
    throw new Error("Failed to fetch data from GraphQL API");
  }
}
