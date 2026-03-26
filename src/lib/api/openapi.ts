import type { components, paths } from "@/lib/api/generated/backend-schema";

type HttpMethod = "delete" | "get" | "patch" | "post" | "put";

type OperationFor<
  Path extends keyof paths,
  Method extends HttpMethod,
> = NonNullable<paths[Path][Method]>;

type JsonContent<Payload> = Payload extends {
  content: {
    "application/json": infer Response;
  };
}
  ? Response
  : Payload extends {
        content: {
          "text/plain": infer Response;
        };
      }
    ? Response
    : undefined;

type SuccessfulResponse<Responses> =
  200 extends keyof Responses
    ? Responses[200]
    : 201 extends keyof Responses
      ? Responses[201]
      : 202 extends keyof Responses
        ? Responses[202]
        : 204 extends keyof Responses
          ? Responses[204]
          : never;

export type ApiSchema<Name extends keyof components["schemas"]> =
  components["schemas"][Name];

export type ApiJsonResponse<
  Path extends keyof paths,
  Method extends HttpMethod,
> = JsonContent<SuccessfulResponse<OperationFor<Path, Method>["responses"]>>;

export type ApiJsonRequestBody<
  Path extends keyof paths,
  Method extends HttpMethod,
> = OperationFor<Path, Method> extends {
  requestBody: {
    content: {
      "application/json": infer Body;
    };
  };
}
  ? Body
  : never;

export type ApiPathParams<
  Path extends keyof paths,
  Method extends HttpMethod,
> = OperationFor<Path, Method> extends {
  parameters: {
    path?: infer Params;
  };
}
  ? Params
  : never;

export type ApiQueryParams<
  Path extends keyof paths,
  Method extends HttpMethod,
> = OperationFor<Path, Method> extends {
  parameters: {
    query?: infer Query;
  };
}
  ? Query
  : never;
