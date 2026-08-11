export async function requireAdmin(request) {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service) {
    return {
      error: 'Faltan variables de entorno de Supabase en Netlify.',
      status: 500
    };
  }

  const authHeader = request.headers.get('authorization') || '';

  if (!authHeader.startsWith('Bearer ')) {
    return {
      error: 'No autorizado. Inicia sesión nuevamente.',
      status: 401
    };
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return {
      error: 'Token de sesión no encontrado.',
      status: 401
    };
  }

  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: service,
      Authorization: `Bearer ${token}`
    }
  });

  if (!userRes.ok) {
    return {
      error: 'Sesión inválida. Cierra sesión e ingresa nuevamente.',
      status: 401
    };
  }

  const user = await userRes.json();

  if (!user?.id) {
    return {
      error: 'No se pudo identificar al usuario.',
      status: 401
    };
  }

  const profRes = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,active`,
    {
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`
      }
    }
  );

  if (!profRes.ok) {
    return {
      error: 'No se pudo verificar el perfil del administrador.',
      status: 500
    };
  }

  const profiles = await profRes.json();

  if (
    !Array.isArray(profiles) ||
    profiles.length === 0 ||
    profiles[0].role !== 'admin' ||
    profiles[0].active !== true
  ) {
    return {
      error: 'Permisos de administrador requeridos.',
      status: 403
    };
  }

  return {
    url,
    service,
    user
  };
}

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  });
