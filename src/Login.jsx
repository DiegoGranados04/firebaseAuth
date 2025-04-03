import { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";

const db = getFirestore();

const Login = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
    }
  }, [role]);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      role: doc.data().role,
      activo: doc.data().activo
    }));
    setUsers(usersList);
  };

  const toggleActiveStatus = async (userId, currentStatus) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { activo: !currentStatus });
    fetchUsers();
  };

  const handleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userData = result.user;

      const userRef = doc(db, "users", userData.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userInfo = userDoc.data();
        if (!userInfo.activo) {
          setError("Tu cuenta está desactivada. Contacta al administrador.");
          await signOut(auth);
          return;
        }
        setUser(userData);
        setRole(userInfo.role);
      } else {
        await setDoc(userRef, { 
          role: "user", 
          email: userData.email,
          activo: true
        });
        setUser(userData);
        setRole("user");
      }
    } catch (error) {
      console.error("Error en el login", error);
      setError("Error al iniciar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      setUsers([]);
      setError(null);
    } catch (error) {
      console.error("Error en el logout", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">🔒 Admin Users</h1>
          <p className="text-gray-500">Gestión avanzada de usuarios registrados</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span className="text-red-600">{error}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-8">
            {/* Información del usuario */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-4">
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                <div>
                  <h2 className="font-semibold text-gray-800">{user.displayName}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {role === 'admin' ? 'Administrador' : 'Usuario'}
              </div>
            </div>

            {/* Tabla de usuarios */}
            {role === "admin" && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((usr) => (
                      <tr key={usr.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{usr.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{usr.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            usr.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {usr.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleActiveStatus(usr.id, usr.activo)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              usr.activo 
                                ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {usr.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Botón de logout */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;