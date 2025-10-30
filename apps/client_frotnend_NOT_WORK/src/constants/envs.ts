interface environments {
    VITE_APP_BACKEND_URL: string;
    NODE_ENV: "development" | "production";
    VITE_APP_SIGNALING_SERVER_URL: string
};

const environments = import.meta.env as unknown as environments;

const envs = () => {
    const requiredKeys = ["VITE_APP_BACKEND_URL", "VITE_APP_SIGNALING_SERVER_URL"] as const;

    const missing = requiredKeys.filter((key) => !Object.hasOwn(environments, key));
    if (missing.length > 0) {
        throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
    }

    return {
        SIGNALING_SERVER_URL: String(environments.VITE_APP_SIGNALING_SERVER_URL),
        BACKEND_URL: String(environments.VITE_APP_BACKEND_URL),
        NODE_ENV: String(environments.NODE_ENV) || "production"
    };
};


export const ENVIRONMENTS = envs();