import { instance } from './instance'

export const axiosGetPrintExportJob = async (jobId, visitorId) => {
  const params = {
    _ts: Date.now(),
  }

  if (visitorId) {
    params.visitorId = visitorId
  }

  const { data } = await instance.get(`/print-export/${jobId}`, {
    params,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })

  return data
}

export const axiosDownloadPrintExportFile = async (
  jobId,
  { visitorId, title } = {},
) => {
  const params = {
    _ts: Date.now(),
  }

  if (visitorId) {
    params.visitorId = visitorId
  }

  if (title) {
    params.title = title
  }

  const response = await instance.get(`/print-export/${jobId}/download`, {
    params,
    responseType: 'blob',
  })

  return {
    blob: response.data,
    contentType: response.headers['content-type'],
  }
}

export const axiosDiscardPrintExportJob = async (jobId, visitorId) => {
  const { data } = await instance.delete(`/print-export/${jobId}`, {
    data: visitorId ? { visitorId } : {},
  })

  return data
}
