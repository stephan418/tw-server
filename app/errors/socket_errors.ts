export class SError {
    private readonly message: string;
    private readonly type: string;
    private readonly props: object;

    private constructor(message: string, type: string, props: object) {
        this.message = message;
        this.props = props;
        this.type = type;
    }

    get response() {
        return {
            message: this.message,
            type: this.type,
            ...this.props
        };
    }

    static argumentMissing(argumentName: string, argumentType: string, argsStyle: object) {
        return new SError(
            'ARG_MISSING',
           `argument '${argumentName}: ${argumentType}' is required`,
            {
                refer: argumentName,
                referType: argumentType,
                style: argsStyle,
            }
        );
    }

    static argumentValueNotFound(argumentName: string, data: string) {
        return new SError(
            'NOT_FOUND',
            `the requested ressource '${argumentName}' '${data}' was not found`,
            {
                refer: argumentName,
                data,
            }
        );
    }


    static limitExceeded(limitName: string, message: string = "the request exceeded an internal limit and was halted") {
        return new SError(
            'LIMIT_EXCEEDED',
            message,
            {
                name: limitName
            }
        );
    }

    static protocolNotFollowed(requestedTask: string, requiredTask: string) {
        return new SError(
            'PROTOCOL',
            `task '${requestedTask}' requires completion of task '${requiredTask}'`,
            {
                requestedTask,
                requiredTask,
            }
        );
    }

    static generic(message: string) {
        return new SError(
            'GENERIC',
            message,
            {},
        )
    }

    static permissionError(requiredPermission: string, message = "permission requirements not fulfilled by client") {
        return new SError(
            'PERMISSION',
            message,
            {
                required: requiredPermission
            }
        )
    }
}
