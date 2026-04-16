'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { createSaleRequest, uploadImagesToCloudinary } from '@/lib/api';

const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 3 * 1024 * 1024;

const collectionOptions = [
  { value: 'sellado', label: 'Sellado' },
  { value: 'cartas', label: 'Cartas' },
  { value: 'slabs', label: 'Slabs' },
];

const inputClass = 'w-full bg-white border border-[#E8E4DD] px-5 py-3.5 text-[13px] text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40 transition-all';
const errorClass = 'mt-2 text-[12px] text-[#B94A48]';

function buildPreviewItem(file) {
  return {
    id: `${file.name}-${file.lastModified}-${file.size}`,
    file,
    preview: URL.createObjectURL(file),
  };
}

export default function VenderColeccionPage() {
  const [form, setForm] = useState({
    nombre_completo: '',
    email: '',
    celular: '',
    tipo_coleccion: 'sellado',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [stageLabel, setStageLabel] = useState('');

  useEffect(() => () => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.preview));
  }, [selectedImages]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const errors = {};

    if (form.nombre_completo.trim().length < 3) {
      errors.nombre_completo = 'Ingresá tu nombre y apellido.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Ingresá un email válido.';
    }

    if (!/^[\d\s\-+().]{7,20}$/.test(form.celular.trim())) {
      errors.celular = 'Ingresá un celular válido.';
    }

    if (!form.tipo_coleccion) {
      errors.tipo_coleccion = 'Seleccioná un tipo de colección.';
    }

    if (selectedImages.length === 0) {
      errors.imagenes = 'Subí al menos una imagen.';
    }

    return errors;
  };

  const handleFilesSelected = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (incomingFiles.length === 0) return;

    const validFiles = [];

    for (const file of incomingFiles) {
      if (!acceptedMimeTypes.includes(file.type)) {
        toast.error(`${file.name}: formato no permitido. Usá JPG, PNG o WEBP.`);
        continue;
      }
      if (file.size > maxFileSize) {
        toast.error(`${file.name}: supera el máximo de 3MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      event.target.value = '';
      return;
    }

    setSelectedImages((current) => {
      const existingIds = new Set(current.map((image) => image.id));
      const next = [...current];
      for (const file of validFiles) {
        const previewItem = buildPreviewItem(file);
        if (existingIds.has(previewItem.id)) {
          URL.revokeObjectURL(previewItem.preview);
          continue;
        }
        next.push(previewItem);
      }
      return next;
    });

    setFieldErrors((current) => {
      if (!current.imagenes) return current;
      const next = { ...current };
      delete next.imagenes;
      return next;
    });

    event.target.value = '';
  };

  const handleRemoveImage = (imageId) => {
    setSelectedImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return current.filter((image) => image.id !== imageId);
    });
  };

  const resetForm = () => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setForm({
      nombre_completo: '',
      email: '',
      celular: '',
      tipo_coleccion: 'sellado',
    });
    setSelectedImages([]);
    setFieldErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Revisá los campos marcados.');
      return;
    }

    setSubmitting(true);
    try {
      setStageLabel('Subiendo imágenes...');
      const uploadedImages = await uploadImagesToCloudinary(selectedImages.map((image) => image.file));

      setStageLabel('Enviando solicitud...');
      const response = await createSaleRequest({
        nombre_completo: form.nombre_completo.trim(),
        email: form.email.trim(),
        celular: form.celular.trim(),
        tipo_coleccion: form.tipo_coleccion,
        imagenes: uploadedImages,
      });

      toast.success(response.message || 'Recibimos tu solicitud.');
      resetForm();
    } catch (error) {
      const apiErrors = error?.data;
      if (apiErrors && typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
        const normalizedErrors = {};
        for (const [key, value] of Object.entries(apiErrors)) {
          normalizedErrors[key] = Array.isArray(value) ? value[0] : String(value);
        }
        setFieldErrors((current) => ({ ...current, ...normalizedErrors }));
      }
      toast.error(error?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
      setStageLabel('');
    }
  };

  return (
    <div className="pt-28 pb-20 bg-[#F9F7F3] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-2 font-medium">Sell your Collection</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-3">Sell your Collection<span className="text-[#C8972E]">.</span></h1>
          <p className="text-[13px] uppercase tracking-[0.18em] text-[#6B6560] italic">Solo +2500$</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-10 xl:gap-16 items-start">
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E8E4DD] shadow-[0_24px_80px_rgba(26,26,26,0.06)] p-6 sm:p-8 lg:p-10"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-2">Nombre y Apellido</label>
                <input
                  type="text"
                  value={form.nombre_completo}
                  onChange={(event) => updateField('nombre_completo', event.target.value)}
                  className={inputClass}
                  placeholder="Tu nombre completo"
                />
                {fieldErrors.nombre_completo && <p className={errorClass}>{fieldErrors.nombre_completo}</p>}
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className={inputClass}
                  placeholder="tu@email.com"
                />
                {fieldErrors.email && <p className={errorClass}>{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-2">Celular</label>
                <input
                  type="tel"
                  value={form.celular}
                  onChange={(event) => updateField('celular', event.target.value)}
                  className={inputClass}
                  placeholder="11 2345 6789"
                />
                {fieldErrors.celular && <p className={errorClass}>{fieldErrors.celular}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-2">Tipo de colección</label>
                <select
                  value={form.tipo_coleccion}
                  onChange={(event) => updateField('tipo_coleccion', event.target.value)}
                  className={inputClass}
                >
                  {collectionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {fieldErrors.tipo_coleccion && <p className={errorClass}>{fieldErrors.tipo_coleccion}</p>}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase">Imágenes</p>
                  <p className="text-[13px] text-[#6B6560] mt-1">JPG, PNG o WEBP hasta 3MB por imagen. Se suben a Cloudinary.</p>
                </div>
                <label className="inline-flex items-center gap-2 bg-[#F5F1EA] border border-[#E8E4DD] px-4 py-3 text-[12px] font-semibold tracking-[0.08em] uppercase text-[#1A1A1A] cursor-pointer hover:border-[#C8972E]/40 transition-colors">
                  <ImagePlus size={16} className="text-[#C8972E]" />
                  Agregar imágenes
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFilesSelected} />
                </label>
              </div>

              {fieldErrors.imagenes && <p className={errorClass}>{fieldErrors.imagenes}</p>}

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedImages.map((image) => (
                  <div key={image.id} className="relative group border border-[#E8E4DD] bg-[#FAF8F4] p-2">
                    <img src={image.preview} alt={image.file.name} className="w-full aspect-square object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-3 right-3 w-9 h-9 bg-[#1A1A1A]/78 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Eliminar imagen"
                    >
                      <Trash2 size={16} />
                    </button>
                    <p className="mt-2 text-[11px] leading-4 text-[#6B6560] truncate">{image.file.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#E8E4DD] pt-6">
              <p className="text-[13px] text-[#6B6560]">Te contactaremos por email y, si corresponde, por WhatsApp al número que cargaste.</p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 bg-[#C8972E] text-white text-[12px] tracking-[0.08em] font-bold px-7 py-4 hover:bg-[#B8851F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {submitting ? stageLabel || 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </motion.form>

          <motion.aside
            className="bg-[#1A1A1A] text-white p-6 sm:p-8 lg:p-10 overflow-hidden relative"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8972E] to-transparent" />
            <p className="text-[11px] tracking-[0.18em] text-[#C8972E] uppercase mb-3">Cómo funciona</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.02em] leading-tight mb-6">Compartí tu colección y la evaluamos manualmente.</h2>

            <div className="space-y-5 text-[14px] leading-7 text-white/72">
              <p>Subí fotos claras del lote, boosters, slabs o cartas para que podamos revisar estado general, cantidad y presentación.</p>
              <p>Este formulario está pensado para colecciones a partir de <span className="text-white font-semibold">$2500 USD</span> en valor estimado.</p>
              <p>Si avanzamos, te vamos a contactar por WhatsApp usando el celular que cargaste en la solicitud.</p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: '1', text: 'Cargás tus datos' },
                { label: '2', text: 'Subís las imágenes' },
                { label: '3', text: 'Revisamos y respondemos' },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] tracking-[0.2em] text-[#C8972E] uppercase mb-2">Paso {item.label}</p>
                  <p className="text-[14px] leading-6 text-white">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}