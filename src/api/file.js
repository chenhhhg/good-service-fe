import request from '@/utils/request'

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: '/files/upload',
    method: 'post',
    data: formData,
    timeout: 60000, // Set timeout to 60 seconds for file uploads
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function downloadFile(fileName) {
  return request({
    url: `/files/download/${fileName}`,
    method: 'get',
    timeout: 600000, // Set timeout to 600 seconds for file uploads
    responseType: 'blob',
  })
}
