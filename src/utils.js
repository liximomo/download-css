import url from 'url';
import path from 'path';

export function chunkify(array, num) {
  if (num === 1) {
    return [array];
  }

  const chunkSize = Math.ceil(array.length / num);
  const result = [];
  for (let i = 0, j = array.length; i < j; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export function urlToPath(urlStr) {
  const parsedUrl = url.parse(urlStr);
  const port = parsedUrl.port ? `:${parsedUrl.port}` : '';
  const prefix = `${parsedUrl.protocol}//${parsedUrl.host}${port}`;
  const basePath = path.dirname(parsedUrl.pathname);
  const name = path.basename(parsedUrl.pathname);
  const ext = path.extname(parsedUrl.pathname);
  return {
    prefix,
    basePath,
    name,
    ext,
  };
}
