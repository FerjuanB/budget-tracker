// Manejo de errores simplificado sin dependencias externas

export interface ApiError {
  message: string
  status?: number
  details?: any
}

// Función para mostrar mensajes de error en consola y alertas
export function handleApiError(error: any): string {
  console.error('API Error:', error)
  
  let errorMessage = 'Ocurrió un error inesperado'
  
  if (error?.response?.data?.message) {
    errorMessage = error.response.data.message
  } else if (error?.message) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  // Mostrar alerta en lugar de toast
  alert(errorMessage)
  return errorMessage
}

// Función para mostrar mensajes de éxito
export function handleSuccess(message: string) {
  console.log('Success:', message)
  // Podrías usar una librería de notificaciones aquí si está disponible
}

// Función para manejar errores de red
export function handleNetworkError() {
  const message = 'No se pudo conectar al servidor. Por favor verifica tu conexión e inténtalo de nuevo.'
  console.error('Network Error:', message)
  alert(message)
}

// Función para crear una promesa con manejo de errores
export function createApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    successMessage?: string
    errorMessage?: string
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
  }
): Promise<T> {
  return apiCall()
    .then((data) => {
      if (options?.successMessage) {
        handleSuccess(options.successMessage)
      }
      if (options?.onSuccess) {
        options.onSuccess(data)
      }
      return data
    })
    .catch((error) => {
      const errorMessage = options?.errorMessage || 'No se pudo completar la operación'
      handleApiError({ message: errorMessage, originalError: error })
      if (options?.onError) {
        options.onError(error)
      }
      throw error
    })
}

// Hook simplificado para manejo de errores (versión básica)
export function useErrorHandler() {
  return {
    handleApiError,
    handleSuccess,
    handleNetworkError,
    createApiCall,
  }
}