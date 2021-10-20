import { useEffect, useState } from "react";
import { api } from '../services/api';
import { createContext, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

interface AuthProvider {
  children: ReactNode;
}

interface AuthContextData {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props: AuthProvider) {
  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=5532246f7a05346a7e2a`;
  const [user, setUser] = useState<User | null>(null); 

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>('/authenticate', {
      code: githubCode,
    });

    const { token, user } = response.data;

    api.defaults.headers.common.authorization = `Bearer ${token}`;
    
    localStorage.setItem('@dowhile:token', token);
    setUser(user);
  }

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token');

    if(token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;

      api.get<User>('/profile').then(response => {
        setUser(response.data);
      });
    }
  }, []);

  useEffect(() => {
    const url = window.location.href;
    const hashGithubCode = url.includes('?code=');
    if(hashGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=');
      window.history.pushState({}, '', urlWithoutCode);
      signIn(githubCode);
    }
  }, []);

  function signOut() {
    setUser(null);
    localStorage.removeItem('@dowhile:token');
  }

  return (
    <AuthContext.Provider value={{signInUrl, user, signOut}}>
      {props.children}
    </AuthContext.Provider>
  );
}
