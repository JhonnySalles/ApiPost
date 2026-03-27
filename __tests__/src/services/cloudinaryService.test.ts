import { v2 as cloudinary } from 'cloudinary';
import { uploadImage } from '../../../src/services/cloudinaryService';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
    },
  },
}));

describe('Cloudinary Service', () => {
  it('deve fazer upload de uma imagem e retornar a secure_url', async () => {
    const mockUrl = 'https://res.cloudinary.com/demo/image/upload/v1570975168/sample.jpg';
    (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({
      secure_url: mockUrl,
    });

    const result = await uploadImage('data:image/jpeg;base64,mockbase64');
    
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith('data:image/jpeg;base64,mockbase64', {
      folder: 'api-post-uploads',
    });
    expect(result).toBe(mockUrl);
  });

  it('deve lançar erro se o upload falhar', async () => {
    (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    await expect(uploadImage('data:image/jpeg;base64,mockbase64')).rejects.toThrow(
      'Falha no upload da imagem para o serviço de hospedagem: Upload failed'
    );
  });
});
