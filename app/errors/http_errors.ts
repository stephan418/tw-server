const SHALLOW_BODY = {
  type: "error",
  error: {
    type: "internal",
    shallow: true,
  },
};

export class HError {
  readonly statusCode: number;
  private readonly _body: object;
  readonly shallow: boolean;

  private constructor(statusCode: number, body: object, shallow: boolean = true) {
    this.statusCode = statusCode;
    this._body = body;
    this.shallow = shallow;
  }

  get response() {
    return this.shallow ? SHALLOW_BODY : this._body;
  }

  // Factory Functions

  static badRequest(error: object, shallow: boolean = false) {
    return new HError(
      400,
      {
        type: "error",
        error: {
          type: "BAD_REQUEST",
          ...error,
        },
      },
      shallow
    );
  }

  static notFound(error: object, shallow: boolean = false) {
    return new HError(400, {
      type: "error",
      error: {
        type: "NOT_FOUND",
        ...error,
      },
    },
    shallow);
  }

  static conflict(error: object, shallow: boolean = false) {
    return new HError(400, {
      type: "error",
      error: {
        type: "CONFLICT",
        ...error,
      },
    }, shallow);
  }

  static internal(error: object, shallow: boolean = true) {
    return new HError(500, {
      type: "error",
      error: {
        type: "INTERNAL",
        ...error,
      }
    }, shallow);
  }

  // Higher level Factory Functions

  static parameterMissing(parameterName: string, endpointStyle: string) {
    return HError.badRequest({
      type: "PARAM_MISSING",
      refer: parameterName,
      style: endpointStyle,
      message: `parameter '${parameterName}' is required`,
    });
  }

  static exists(parameterName: string, data: string) {
    return HError.conflict({
      type: "EXISTS",
      refer: parameterName,
      data,
      message: `'${parameterName}' '${data}' is already in use`,
    });
  }

  static parameterValueNotFound(parameterName: string, data: string) {
    return HError.notFound({
      location: 'GET_PARAMETER',
      refer: parameterName,
      data,
      message: `the requested ressource '${parameterName}' '${data}' was not found`,
    })
  }

  static limitExceeded(limit_name: string, message: string = "the request exceeded an internal limit and was halted") {
    return HError.internal({
      type: "LIMIT_EXCEEDED",
      name: limit_name,
      message,
    }, false);
  }
}
