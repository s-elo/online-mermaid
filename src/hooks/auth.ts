import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { initAuth } from '../api/github';

export function useAuth(checkApi: () => Promise<void>) {
  const pwd = ref('');
  const showAuth = ref(false);
  const checkLoading = ref(false);

  const checkAuth = async () => {
    if (!pwd.value.trim()) {
      return ElMessage({ type: 'error', message: 'Please input password' });
    }
    checkLoading.value = true;
    try {
      initAuth(pwd.value);
      await checkApi();
      localStorage.setItem('mermaid_token_pwd', pwd.value);
      showAuth.value = false;
    } catch {
      showAuth.value = true;
      return ElMessage({ type: 'error', message: 'wrong password' });
    } finally {
      checkLoading.value = false;
    }
  };

  const isAuth = initAuth();
  if (!isAuth) {
    showAuth.value = true;
  }

  return {
    pwd,
    showAuth,
    checkAuth,
    checkLoading,
  };
}
