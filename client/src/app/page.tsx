'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ email: '', password: '' });

  const submitForm = async () => {
    try {
      await api.post('/auth/login', form, { withCredentials: true });
      const response = await api.get('/account');
      setData(response.data);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };
  const logout = async () => {
    try {
      await api.post('/auth/logout', form, { withCredentials: true });
      const response = await api.get('/account');
      setData(response.data);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/account');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <div>
        <p>Email</p>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <p>Password</p>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Button onClick={() => submitForm()} type="submit">Submit</Button>
        <Button onClick={() => logout()} type="submit">Logout</Button>
      </div>
    </div>
  );
}
