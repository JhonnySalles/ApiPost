import { v2 as cloudinary } from 'cloudinary';
import Logger from '../config/logger';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Faz o upload de uma imagem em formato Data URL para o Cloudinary.
 * @param base64Image A imagem no formato 'data:image/jpeg;base64,...'
 * @returns A URL segura da imagem hospedada.
 */
export async function uploadImage(base64Image: string): Promise<string> {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: "api-post-uploads",
        });
        return result.secure_url;
    } catch (error) {
        Logger.error('Erro ao fazer upload para o Cloudinary: %o', error);
        throw new Error('Falha no upload da imagem para o serviço de hospedagem.');
    }
}