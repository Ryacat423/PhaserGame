import type { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * SweetAlert2 dialog, loaded the first time one is shown. Only the custom level panel uses
 * dialogs, so the library and its stylesheet stay off the first screen.
 */
export async function showDialog(options: SweetAlertOptions): Promise<SweetAlertResult> {
  const [{ default: Swal }] = await Promise.all([
    import('sweetalert2'),
    import('sweetalert2/dist/sweetalert2.min.css')
  ]);
  return Swal.fire(options);
}
