import { AuthTokenPayload } from '../validators/jwt.validator';

declare global {
    namespace Express {
        interface Request {
       user?: AuthTokenPayload;    
    }
    }
}

export {};