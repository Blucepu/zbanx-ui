const DEFAULT_OSS_PROCESSABLE_HOSTS = [
  "zbanx-oa-image.oss-ap-southeast-1.aliyuncs.com",
  "g.zbanx.com",
  "zbanx-oa-test.oss-cn-chengdu.aliyuncs.com",
];

interface OssThumbOptions {
  /** 缩放宽度（px），默认 200 */
  width?: number;
  /** 额外允许的图片域名（与默认白名单合并） */
  extraHosts?: string[];
}

/**
 * 生成 OSS 图片缩略图 URL，减少列表请求的图片体积。
 * - 仅白名单域名生效，其他地址原样返回
 * - 追加 x-oss-process=image/resize,w_{width}/format,webp
 *
 * @example
 * getOssThumbUrl("https://g.zbanx.com/OA/brand_images/xxx.png")
 * // https://g.zbanx.com/OA/brand_images/xxx.png?x-oss-process=image/resize,w_200/format,webp
 */
export function getOssThumbUrl(
  url: string | null | undefined,
  options?: OssThumbOptions
): string {
  if (!url) return "";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const hostSet = new Set(
    [...DEFAULT_OSS_PROCESSABLE_HOSTS, ...(options?.extraHosts ?? [])].map(
      (host) => host.toLowerCase()
    )
  );
  if (!hostSet.has(parsed.hostname.toLowerCase())) return url;
  const width =
    options?.width && options.width > 0 ? Math.floor(options.width) : 200;
  // 手工拼接查询串：x-oss-process 的值需保持 image/resize,w_200/format,webp 原样，URLSearchParams 会将其转义导致 OSS 不识别
  parsed.searchParams.delete("x-oss-process");
  const query = parsed.searchParams.toString();
  const process = `x-oss-process=image/resize,w_${width}/format,webp`;
  return `${parsed.origin}${parsed.pathname}${query ? `?${query}&${process}` : `?${process}`}${parsed.hash}`;
}
