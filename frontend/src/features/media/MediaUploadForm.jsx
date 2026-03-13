import { useRef, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import FormFileUpload from '../../components/forms/FormFileUpload';
import FormSelect from '../../components/forms/FormSelect';
import FormInput from '../../components/forms/FormInput';
import { mediaSchema } from '../../utils/validators';
import { createMedia } from './mediaSlice';
import { useToast } from '../../hooks/useToast';

export default function MediaUploadForm() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { loading } = useSelector((state) => state.media);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef(null);
  const defaultValues = { filename: '', originalName: '', url: '', mediaType: 'IMAGE', size: '', file: null };
  const { register, reset, setValue, handleSubmit, formState: { errors } } = useForm({
    defaultValues,
    resolver: yupResolver(mediaSchema)
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file, { shouldValidate: true });
      setValue('filename', file.name, { shouldValidate: true });
      setValue('originalName', file.name, { shouldValidate: true });
      setValue('url', '', { shouldValidate: false });
      setValue('size', file.size || 1024, { shouldValidate: true });
    } else {
      setSelectedFile(null);
      reset(defaultValues);
    }
  };

  const onSubmit = async (values) => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mediaType', values.mediaType);

    const result = await dispatch(createMedia(formData));
    if (!result.error) {
      toast.success(`Uploaded ${selectedFile?.name || values.filename}`);
      setSelectedFile(null);
      reset(defaultValues);
      setFileInputKey((current) => current + 1);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      toast.error(result.payload);
    }
  };

  return (
    <form className="card border-0 shadow-sm mb-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="card-body p-4">
        <h2 className="h4 fw-bold mb-3">Upload Media</h2>
        <FormFileUpload label="Select file" name="file" register={register} error={errors.file} onChange={handleFileChange} inputRef={fileInputRef} inputKey={fileInputKey} />
        <FormInput label="Filename" name="filename" register={register} error={errors.filename} readOnly />
        <FormInput label="Original name" name="originalName" register={register} error={errors.originalName} readOnly />
        <FormInput label="URL" name="url" register={register} error={errors.url} placeholder="Generated after upload" readOnly />
        <FormInput label="Size" name="size" type="number" register={register} error={errors.size} readOnly />
        <FormSelect
          label="Media type"
          name="mediaType"
          register={register}
          error={errors.mediaType}
          options={[
            { value: 'IMAGE', label: 'Image' },
            { value: 'VIDEO', label: 'Video' },
            { value: 'DOCUMENT', label: 'Document' }
          ]}
        />
        <button type="submit" className="btn btn-dark" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Upload
        </button>
      </div>
    </form>
  );
}