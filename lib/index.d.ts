export declare function create_client<T>(send: (body: {
    operationName: string;
    query: string;
    variables?: any;
}, extra?: any) => T): {
    run: (query: string, variables?: any, extra?: any) => T;
    register_fragment: (fragment: string) => void;
    fragments: {};
};
