'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendContact } from '@/lib/api';

export default function ContactoPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await sendContact(form);
      toast.success(res.message || 'Mensaje enviado. Te respondemos pronto.');
      setForm({ name: '', email: '', message: '' });
    } catch {
      toast.error('Error al enviar el mensaje. Intentá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full bg-white border border-[#E8E4DD] px-5 py-3.5 text-[13px] text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40 transition-all";

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-2 font-medium">Contacto</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-12">Hablemos<span className="text-[#C8972E]">.</span></h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.form onSubmit={handleSubmit} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div>
              <label className="block text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-2">Nombre</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Tu nombre" />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-2">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-2">Mensaje</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputClass + ' resize-none'} placeholder="¿En qué podemos ayudarte?" />
            </div>
            <button type="submit" disabled={sending} className="bg-[#C8972E] text-white text-[12px] tracking-[0.05em] font-bold px-8 py-4 hover:bg-[#B8851F] transition-colors disabled:opacity-50">
              {sending ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </motion.form>

          <motion.div className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="space-y-6">
              {[
                { icon: Mail, label: 'Email', value: 'contacto@crack.com.ar' },
                { icon: Phone, label: 'WhatsApp', value: '+54 11 1234-5678' },
                { icon: MapPin, label: 'Ubicación', value: 'Buenos Aires, Argentina' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#F5F1EA] border border-[#E8E4DD] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#C8972E]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B6560]/60 uppercase tracking-wider">{label}</p>
                    <p className="text-[14px] text-[#1A1A1A]/80 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[11px] tracking-[0.15em] text-[#6B6560]/60 uppercase mb-4">Seguinos!</p>
              <div className="flex gap-4">
                {['Instagram', 'Twitter', 'WhatsApp'].map((s) => (
                  <a key={s} href="#" className="text-[13px] text-[#6B6560] hover:text-[#C8972E] transition-colors">{s}</a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
