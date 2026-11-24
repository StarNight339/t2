// แจ้งเตือนเล็กๆ มุมขวาบน (ใช้ในหลังบ้าน)
export function useToast() {
  const state = useState('toast', () => ({ show: false, text: '', color: 'success' }))
  return {
    state,
    ok: (text: string) => { state.value = { show: true, text, color: 'success' } },
    fail: (text: string) => { state.value = { show: true, text, color: 'error' } },
  }
}
