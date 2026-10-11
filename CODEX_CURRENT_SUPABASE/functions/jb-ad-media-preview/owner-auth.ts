/**
 * B7 ADS-009/015 single Owner AAL2 identity authority.
 * REVIEW-ONLY candidate — requires REAL E5 before Production deployment.
 * Shared verifier with isolated video worker: no parallel role SOT, no keys.
 */
import {identifyB7OwnerAal2} from '../_shared/b7-owner-identity.mjs';
export type OwnerHttpConfig={
 baseUrl:string;
 anonKey:string;
 request?:typeof fetch;
};
export async function identifyAdMediaOwner(token:string,config:OwnerHttpConfig):Promise<string|null>{
 return identifyB7OwnerAal2(token,config);
}
export async function verifyAdMediaOwner(token:string,config:OwnerHttpConfig):Promise<boolean>{
 return (await identifyAdMediaOwner(token,config))!==null;
}
