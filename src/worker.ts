import {
  createCloudflareAuthority,
} from "thimbledb/authority/cloudflare";
import { collectionIndexes } from "./collections";

export default createCloudflareAuthority({
  collectionLayouts: {
    notes: "snapshot",
  },
  collectionIndexes,
});
