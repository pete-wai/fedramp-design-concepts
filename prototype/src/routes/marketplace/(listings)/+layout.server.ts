import { asset } from '$lib/utils/paths';

export async function load() {
  const metaImage = `${asset('/marketplace-metadata/default-marketplace-image.png')}`;
  return {
    metaImage
  };
}
