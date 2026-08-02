"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import styles from "./profile.module.css";

export function AccountSettings() {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!user || !session) {
    return (
      <section className={styles.accountCard}>
        <p className="eyebrow">Cuenta</p>
        <h2>Administra tu información</h2>
        <p>Inicia sesión para editar tus datos y guardar tus preferencias.</p>
        <Link className={styles.primaryAction} href="/login">Iniciar sesión</Link>
      </section>
    );
  }

  const activeSession = session;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await activeSession.updateProfile({ name });
      setStatus("Nombre actualizado correctamente.");
    } catch (reason) {
      setStatus(reason instanceof ApiError ? reason.message : "No pudimos actualizar tu perfil.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    activeSession.logout();
    router.replace("/login");
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== passwordConfirmation) {
      setPasswordStatus("Las contraseñas nuevas no coinciden.");
      return;
    }
    setChangingPassword(true);
    setPasswordStatus("");
    try {
      await activeSession.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");
      setPasswordStatus("Contraseña actualizada correctamente.");
    } catch (reason) {
      setPasswordStatus(reason instanceof ApiError ? reason.message : "No pudimos actualizar tu contraseña.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function deleteAccount(event: FormEvent) {
    event.preventDefault();
    if (deleteConfirmation !== "ELIMINAR MI CUENTA") {
      setDeleteStatus("Escribe ELIMINAR MI CUENTA para continuar.");
      return;
    }
    if (!window.confirm("Esta acción elimina permanentemente tu cuenta, favoritos y preferencias. ¿Quieres continuar?")) return;

    setDeleting(true);
    setDeleteStatus("");
    try {
      await activeSession.deleteAccount(deleteConfirmation);
      router.replace("/");
    } catch (reason) {
      setDeleteStatus(reason instanceof ApiError ? reason.message : "No pudimos eliminar tu cuenta.");
      setDeleting(false);
    }
  }

  return (
    <section className={styles.accountCard}>
      <div className={styles.sectionHeading}>
        <div>
          <p className="eyebrow">Cuenta</p>
          <h2>Información personal</h2>
        </div>
        <span>Datos básicos</span>
      </div>
      <form className={styles.accountForm} onSubmit={submit}>
        <label>
          Nombre visible
          <input value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={80} required />
        </label>
        <label>
          Correo electrónico
          <input value={user.email} readOnly aria-readonly="true" />
          <small>El correo no se puede modificar desde la web para proteger tu cuenta.</small>
        </label>
        {status && <p className={styles.status} role="status">{status}</p>}
        <button className={styles.primaryAction} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
      </form>
      <section className={styles.securitySection}>
        <div>
          <p className="eyebrow">Seguridad</p>
          <h3>Contraseña</h3>
        </div>
        {user.hasPassword ? (
          <form className={styles.passwordForm} onSubmit={changePassword}>
            <label>
              Contraseña actual
              <input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            <label>
              Nueva contraseña
              <input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" required />
              <small>Usa al menos 8 caracteres.</small>
            </label>
            <label>
              Repite la nueva contraseña
              <input type="password" value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} minLength={8} autoComplete="new-password" required />
            </label>
            {passwordStatus && <p className={styles.status} role="status">{passwordStatus}</p>}
            <button className={styles.secondaryAction} disabled={changingPassword}>{changingPassword ? "Actualizando…" : "Cambiar contraseña"}</button>
          </form>
        ) : (
          <p className={styles.helpText}>Tu cuenta usa acceso con Google. La contraseña se gestiona directamente con ese proveedor.</p>
        )}
      </section>
      <div className={styles.sessionRow}>
        <div>
          <strong>Sesión en este dispositivo</strong>
          <span>Cierra sesión si usas un equipo compartido.</span>
        </div>
        <button className={styles.textAction} type="button" onClick={logout}>Cerrar sesión</button>
      </div>
      <section className={styles.dangerZone}>
        <div>
          <p className="eyebrow">Acción irreversible</p>
          <h3>Eliminar mi cuenta</h3>
          <p>Se eliminarán permanentemente tu cuenta, favoritos, ciudad y preferencias olfativas. Esta acción no se puede deshacer.</p>
        </div>
        <form className={styles.deleteForm} onSubmit={deleteAccount}>
          <label>
            Escribe <strong>ELIMINAR MI CUENTA</strong> para confirmar
            <input value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} autoComplete="off" required />
          </label>
          {deleteStatus && <p className={styles.deleteStatus} role="status">{deleteStatus}</p>}
          <button className={styles.dangerAction} disabled={deleting || deleteConfirmation !== "ELIMINAR MI CUENTA"}>{deleting ? "Eliminando…" : "Eliminar cuenta permanentemente"}</button>
        </form>
      </section>
    </section>
  );
}
