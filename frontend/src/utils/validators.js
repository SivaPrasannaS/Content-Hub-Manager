import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

export const registerSchema = yup.object({
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

export const articleSchema = yup.object({
  title: yup.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be at most 200 characters').required('Title is required'),
  body: yup.string().min(20, 'Body must be at least 20 characters').required('Body is required'),
  excerpt: yup.string().max(500, 'Excerpt must be at most 500 characters').nullable(),
  categoryId: yup.string().required('Category is required'),
  status: yup.string().oneOf(['DRAFT', 'PUBLISHED']),
  tags: yup.string().nullable()
});

export const pageSchema = yup.object({
  title: yup.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be at most 200 characters').required('Title is required'),
  body: yup.string().min(20, 'Body must be at least 20 characters').required('Body is required'),
  status: yup.string().oneOf(['DRAFT', 'PUBLISHED']).required('Status is required')
});

export const categorySchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').required('Name is required'),
  description: yup.string().nullable()
});

export const mediaSchema = yup.object({
  file: yup.mixed().required('File is required'),
  filename: yup.string().required('Filename is required'),
  originalName: yup.string().required('Original name is required'),
  url: yup.string().nullable(),
  mediaType: yup.string().oneOf(['IMAGE', 'VIDEO', 'DOCUMENT']).required('Media type is required'),
  size: yup.number().transform((value, originalValue) => (originalValue === '' ? undefined : value)).positive('Size must be positive').required('Size is required')
});