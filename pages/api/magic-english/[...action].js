import {createMagicEnglishApi} from '../../../lib/magicEnglishApi.cjs';
const handler=createMagicEnglishApi();
export const config={api:{bodyParser:false,responseLimit:'4mb'},maxDuration:60};
export default handler;
