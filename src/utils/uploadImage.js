import { readApiResponse } from './apiConfig';

export const uploadImage = async (file, apiBaseUrl, setErrorMessage) => {
    try {
        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file. Please select a valid image.');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${apiBaseUrl}/images/upload`, {
            method: 'POST',
            body: formData,
        });

        const responseData = await readApiResponse(response);
        return responseData.imageUrl;
    } catch (error) {
        console.error('Image upload error:', error);
        if (setErrorMessage) {
            setErrorMessage(error.message || 'Image upload failed. Try again.');
        }
        return null;
    }
};
