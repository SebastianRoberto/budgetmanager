import Swal from 'sweetalert2';

export const SwalUtils = {
  success(title: string, message?: string) {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#6366f1',
      timer: 3000,
      timerProgressBar: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  },

  error(title: string, message?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text: message || 'Ocurrió un error inesperado',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc2626'
    });
  },

  warning(title: string, message?: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#f59e0b'
    });
  },

  confirm(title: string, message?: string, confirmText = 'Sí, continuar', cancelText = 'Cancelar') {
    return Swal.fire({
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });
  },

  loading(title = 'Procesando...') {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  close() {
    Swal.close();
  }
};

