'use client';
import { useEffect, useState } from 'react';
import { Home, Loader2, MapPin, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import AccountShell, { AccountLoading } from '@/components/account/AccountShell';
import { useSession } from '@/components/account/SessionProvider';
import {
  PROVINCES,
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
  sectionTitle,
  textButton,
} from '@/components/account/ui';
import { createAddress, deleteAddress, getAddresses, updateAddress, updateProfile } from '@/lib/customerApi';

const EMPTY_ADDRESS = {
  kind: 'home',
  branch_name: '',
  first_name: '',
  last_name: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  zip_code: '',
  is_default: false,
};

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className={sectionTitle}>{title}</h2>
      {action}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

function FormActions({ saving, onCancel, label = 'GUARDAR' }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button type="submit" disabled={saving} className={primaryButton}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
        {label}
      </button>
      <button type="button" onClick={onCancel} className={textButton}>Cancelar</button>
    </div>
  );
}

// ─── Contacto ────────────────────────────────────────────────────────────────

function ContactSection() {
  const { profile, setProfile } = useSession();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setForm({ first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone });
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      setProfile(await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      }));
      setEditing(false);
      toast.success('Datos guardados');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  const rows = [
    ['Nombre', fullName || '—'],
    ['Correo electrónico', profile.email],
    ['Teléfono', profile.phone || '—'],
  ];

  return (
    <section>
      <SectionHeader
        title="Contacto"
        action={!editing && <button type="button" onClick={startEditing} className={secondaryButton}>Editar</button>}
      />
      {editing ? (
        <form onSubmit={save} className={`${cardClass} p-5 sm:p-6 space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre">
              <input className={inputClass} autoComplete="given-name" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Apellido">
              <input className={inputClass} autoComplete="family-name" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
            <Field label="Correo electrónico">
              <input className={inputClass} value={profile.email} disabled />
            </Field>
            <Field label="Teléfono">
              <input className={inputClass} type="tel" autoComplete="tel" placeholder="+54 11 1234-5678" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <FormActions saving={saving} onCancel={() => setEditing(false)} />
        </form>
      ) : (
        <dl className={`${cardClass} divide-y divide-[#E8E4DD]/70`}>
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 sm:px-6 py-4">
              <dt className="text-[13px] text-[#6B6560]">{label}</dt>
              <dd className="text-[14px] text-[#1A1A1A] break-all">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

// ─── Direcciones ─────────────────────────────────────────────────────────────

/**
 * Dos tipos, como en el checkout: el domicilio (envío a domicilio) y la
 * sucursal de correo donde retira (envío a sucursal por Correo Argentino, el
 * que más se usa para el interior). Cada tipo tiene su predeterminada, y el
 * checkout completa con la que corresponde al método de envío elegido.
 */
const KINDS = {
  home: {
    label: 'Domicilio',
    plural: 'Domicilios',
    icon: Home,
    addressLabel: 'Dirección *',
    addressPlaceholder: 'Calle, número, piso y depto',
    cityLabel: 'Ciudad *',
    zipLabel: 'Código postal *',
    defaultLabel: 'Usar como domicilio predeterminado',
  },
  branch: {
    label: 'Sucursal de correo',
    plural: 'Sucursales de correo',
    icon: Store,
    addressLabel: 'Dirección de la sucursal *',
    addressPlaceholder: 'Calle y número de la sucursal',
    cityLabel: 'Ciudad de la sucursal *',
    zipLabel: 'Código postal de la sucursal *',
    defaultLabel: 'Usar como sucursal predeterminada',
  },
};

function KindSwitch({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Tipo de dirección" className="grid grid-cols-2 gap-1 p-1 bg-[#F5F1EA] rounded-lg">
      {Object.entries(KINDS).map(([kind, { label, icon: Icon }]) => {
        const active = value === kind;
        return (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(kind)}
            className={`flex items-center justify-center gap-2 h-10 rounded-md text-[13px] font-semibold transition-all ${
              active ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6560] hover:text-[#1A1A1A]'
            }`}
          >
            <Icon size={15} className={active ? 'text-[#C8972E]' : ''} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function AddressForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const kind = KINDS[form.kind] || KINDS.home;
  const isBranch = form.kind === 'branch';

  const save = async (e) => {
    e.preventDefault();
    if (!form.address.trim() || !form.city.trim() || !form.province || !form.zip_code.trim()) {
      toast.error('Completá dirección, ciudad, provincia y código postal.');
      return;
    }
    setSaving(true);
    try {
      const { id, ...data } = form;
      const payload = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      );
      await (id ? updateAddress(id, payload) : createAddress(payload));
      toast.success(isBranch ? 'Sucursal guardada' : 'Dirección guardada');
      onSaved();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={`${cardClass} p-5 sm:p-6 space-y-5`}>
      <KindSwitch value={form.kind} onChange={(value) => setForm({ ...form, kind: value })} />

      {isBranch && (
        <p className="text-[12px] text-[#6B6560] leading-relaxed bg-[#FAFAF7] border border-[#E8E4DD] rounded-lg px-4 py-3">
          Para envíos a sucursal de Correo Argentino: cargá los datos de la sucursal donde vas a retirar.
          Si no la conocés, buscala en{' '}
          <a href="https://www.correoargentino.com.ar" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] underline underline-offset-2">
            correoargentino.com.ar
          </a>.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isBranch && (
          <div className="sm:col-span-2">
            <Field label="Nombre de la sucursal">
              <input className={inputClass} placeholder="Ej: Correo Argentino — Sucursal Centro"
                value={form.branch_name} onChange={set('branch_name')} />
            </Field>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label={kind.addressLabel}>
            <input className={inputClass} autoComplete={isBranch ? 'off' : 'street-address'} placeholder={kind.addressPlaceholder}
              value={form.address} onChange={set('address')} />
          </Field>
        </div>
        <Field label={kind.cityLabel}>
          <input className={inputClass} autoComplete={isBranch ? 'off' : 'address-level2'} value={form.city} onChange={set('city')} />
        </Field>
        <Field label="Provincia *">
          <select className={`${inputClass} appearance-none`} value={form.province} onChange={set('province')}>
            <option value="">Seleccioná</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label={kind.zipLabel}>
          <input className={inputClass} inputMode="numeric" maxLength={4} autoComplete={isBranch ? 'off' : 'postal-code'} placeholder="1429"
            value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <Field label="Teléfono">
          <input className={inputClass} type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </Field>
      </div>

      <div>
        <p className="text-[11px] tracking-[0.1em] text-[#6B6560] uppercase mb-2 font-medium">
          {isBranch ? 'Quién retira' : 'Quién recibe'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className={inputClass} autoComplete="given-name" placeholder="Nombre" aria-label="Nombre"
            value={form.first_name} onChange={set('first_name')} />
          <input className={inputClass} autoComplete="family-name" placeholder="Apellido" aria-label="Apellido"
            value={form.last_name} onChange={set('last_name')} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-[13px] text-[#1A1A1A] cursor-pointer select-none">
        <input type="checkbox" className="w-4 h-4 accent-[#C8972E]" checked={form.is_default}
          onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
        {kind.defaultLabel}
      </label>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  );
}

function AddressCard({ address, disabled, deleting, onEdit, onDelete }) {
  const kind = KINDS[address.kind] || KINDS.home;
  const Icon = kind.icon;
  const person = [address.first_name, address.last_name].filter(Boolean).join(' ');

  return (
    <li className={`${cardClass} flex flex-col sm:flex-row sm:items-start gap-4 px-5 sm:px-6 py-4`}>
      <span className="w-11 h-11 rounded-lg bg-[#F5F1EA] flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-[#1A1A1A]" />
      </span>
      <div className="flex-1 text-[14px] text-[#1A1A1A] leading-relaxed min-w-0">
        {address.is_default && (
          <span className="inline-block mb-1 text-[10px] font-bold tracking-[0.12em] uppercase text-[#C8972E]">
            Predeterminada
          </span>
        )}
        {address.kind === 'branch' && address.branch_name && <p className="font-semibold">{address.branch_name}</p>}
        <p>{address.address}</p>
        <p className="text-[#6B6560]">{address.city}, {address.province} (CP {address.zip_code})</p>
        {(person || address.phone) && (
          <p className="text-[#6B6560]">
            {address.kind === 'branch' ? 'Retira: ' : 'Recibe: '}
            {[person, address.phone].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <button type="button" onClick={onEdit} className={textButton} disabled={disabled}>Editar</button>
        <button type="button" onClick={onDelete} className={textButton} disabled={deleting}>
          {deleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </li>
  );
}

function AddressesSection() {
  const [addresses, setAddresses] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [deleting, setDeleting] = useState(null);

  const load = () => getAddresses().then(setAddresses).catch((e) => toast.error(e.message));

  useEffect(() => { load(); }, []);

  const saved = () => {
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    setDeleting(id);
    try {
      await deleteAddress(id);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(null);
    }
  };

  const groups = Object.keys(KINDS)
    .map((kind) => ({ kind, items: (addresses || []).filter((a) => a.kind === kind) }))
    .filter((group) => group.items.length > 0);

  return (
    <section>
      <SectionHeader
        title="Direcciones"
        action={editing === null && <button type="button" onClick={() => setEditing('new')} className={secondaryButton}>Agregar</button>}
      />

      {editing === 'new' && (
        <div className="mb-4">
          <AddressForm
            initial={{ ...EMPTY_ADDRESS, is_default: !addresses?.some((a) => a.kind === 'home') }}
            onSaved={saved}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {addresses === null ? (
        <div className={`${cardClass} px-6 py-8 flex justify-center`}><Loader2 size={18} className="animate-spin text-[#6B6560]" /></div>
      ) : addresses.length === 0 ? (
        editing !== 'new' && (
          <div className={`${cardClass} flex items-center gap-4 px-5 sm:px-6 py-5`}>
            <span className="w-11 h-11 rounded-lg bg-[#F5F1EA] flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-[#1A1A1A]" />
            </span>
            <div>
              <p className="text-[14px] text-[#6B6560]">No se agregaron direcciones.</p>
              <p className="text-[12px] text-[#6B6560]/80 mt-0.5">Guardá tu domicilio o la sucursal de correo donde retirás, y el checkout se completa solo.</p>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {groups.map(({ kind, items }) => (
            <div key={kind}>
              {groups.length > 1 && (
                <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6560] font-medium mb-2.5">{KINDS[kind].plural}</p>
              )}
              <ul className="space-y-3">
                {items.map((a) =>
                  editing === a.id ? (
                    <li key={a.id}>
                      <AddressForm initial={a} onSaved={saved} onCancel={() => setEditing(null)} />
                    </li>
                  ) : (
                    <AddressCard
                      key={a.id}
                      address={a}
                      disabled={editing !== null}
                      deleting={deleting === a.id}
                      onEdit={() => setEditing(a.id)}
                      onDelete={() => remove(a.id)}
                    />
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Sesión ──────────────────────────────────────────────────────────────────

function SignOutSection() {
  const { signOut } = useSession();
  const [loading, setLoading] = useState('');

  const leave = async (everywhere) => {
    setLoading(everywhere ? 'all' : 'here');
    try {
      // Sin sesión, AccountShell manda al login.
      await signOut({ everywhere });
    } catch (error) {
      toast.error(error.message);
      setLoading('');
    }
  };

  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <button type="button" onClick={() => leave(false)} disabled={!!loading} className={`${secondaryButton} px-5 py-3`}>
        {loading === 'here' ? <Loader2 size={14} className="animate-spin" /> : null}
        Cerrar sesión
      </button>
      <button type="button" onClick={() => leave(true)} disabled={!!loading} className={textButton}>
        {loading === 'all' ? 'Cerrando…' : 'Cerrar sesión en todos los dispositivos'}
      </button>
    </section>
  );
}

function Profile() {
  const { profile, profileError } = useSession();
  // El perfil llega con la sincronización de la sesión; hasta entonces, cargando.
  // Si falló, el error ya lo muestra AccountShell.
  if (!profile) return profileError ? null : <AccountLoading />;

  return (
    <div className="space-y-10">
      <ContactSection />
      <AddressesSection />
      <SignOutSection />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <AccountShell>
      <Profile />
    </AccountShell>
  );
}
