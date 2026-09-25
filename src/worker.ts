import {
  createCloudflareAuthority,
} from "thimbledb/authority/cloudflare";
import { collectionIndexes } from "./collections";

export default createCloudflareAuthority({
  studio: true,
  readBundles: true,
  collections: ["notes"],
  collectionLayouts: {
    notes: "snapshot",
  },
  collectionIndexes,
});
