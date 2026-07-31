import { strict as assert } from "node:assert";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const key = `ops/storage-check-${Date.now()}.txt`;
const body = "raspon-storage-check";
const publicBucket = process.env.R2_BUCKET_NAME;
const privateBucket = process.env.R2_PRIVATE_BUCKET_NAME;

try {
  for (const bucket of [publicBucket, privateBucket]) {
    const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: "text/plain", ContentLength: body.length }), { expiresIn: 60 });
    const upload = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": "text/plain" }, body });
    assert.equal(upload.status, 200);
  }
  const publicRead = await fetch(`${process.env.R2_PUBLIC_URL}/${key}`);
  assert.equal(publicRead.status, 200);
  assert.equal(await publicRead.text(), body);

  const anonymousPrivate = await fetch(`${process.env.S3_ENDPOINT}/${privateBucket}/${key}`);
  assert.equal(anonymousPrivate.status, 403);
  const privateUrl = await getSignedUrl(client, new GetObjectCommand({ Bucket: privateBucket, Key: key }), { expiresIn: 60 });
  const privateRead = await fetch(privateUrl);
  assert.equal(privateRead.status, 200);
  assert.equal(await privateRead.text(), body);
  console.log("Storage SDK verification passed");
} finally {
  await Promise.allSettled([publicBucket, privateBucket].map((Bucket) => client.send(new DeleteObjectCommand({ Bucket, Key: key }))));
}
