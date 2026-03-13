export const showToast = (message, variant = 'success') => {
  window.dispatchEvent(
    new CustomEvent('chm-toast', {
      detail: { message, variant }
    })
  );
};

export const useToast = () => ({
  success(message) {
    showToast(message, 'success');
  },
  error(message) {
    showToast(message, 'danger');
  }
});

export default useToast;