import morgan from "morgan";

// Format: Method Endpoint Status ResponseTime
export const logger = morgan(":method :url :status :response-time ms");