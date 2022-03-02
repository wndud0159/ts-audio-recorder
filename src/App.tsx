import React, { useCallback, useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
import { CenterHeader, Text } from '../../components'
import { TextSize } from '../../components/Text'
import { ReactComponent as WillMicOnIcon } from '../../assets/images/will_mic_on_icon.svg'
import { ReactComponent as WillBackIcon } from '../../assets/images/will_back_icon.svg'
import { useReactMediaRecorder } from 'react-media-recorder'
import { Complete, CompleteModal, ReadWitnessModal, Stopwatch } from '../../components/Will'
import WillService from '../../services/WillService'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import UserService from '../../services/UserService'
import { format } from '../../utils/day'
import { ReactComponent as WillTextModal02 } from '../../assets/images/will_text_modal02.svg'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { textSizeStateInitial } from '../../state/textSize'
import ChecklistService from '../../services/ChecklistService'
import { UpdateChecklist } from '../../types/checklist'
import RecordService from '../../services/RecordService'
import { CreateRecord } from '../../types/record'
import { useStopwatch } from 'react-timer-hook'

export default function WillRecording() {
  const navigate = useNavigate()
  let will: string[] = []
  const today = new Date()
  const queryClient = useQueryClient()
  const textSizeState = useRecoilValue(textSizeStateInitial)
  const [isWitness, setIsWitness] = useState(false)
  const [isModal, setIsModal] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [isStart, setIsStart] = useState(false)
  const [isPause, setIsPause] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [isDownload, setIsDownload] = useState(false)
  const { seconds, minutes, start, pause } = useStopwatch({ autoStart: false })
  const [isComplete, setIsComplete] = useState(false)
  const [isCompleteModal, setIsCompleteModal] = useState(false)
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
  })

  const { data: autoCompleteData } = useQuery(`wills/auto-complete`, () =>
    WillService.autoComplete(),
  )

  const { data: userData, isLoading, error } = useQuery('users/me', () => UserService.findByToken())

  useEffect(() => {
    startRecording()
  }, [])

  useEffect(() => {
    if (status === 'recording') {
      setIsStart((prev) => true)
      start()
    }
  }, [status])

  useEffect(() => {
    if (pageIndex + 1 === will.length) {
      setIsWitness(true)
    }
  }, [pageIndex])

  useEffect(() => {
    if (userData) {
      if (!userData.checklist.isRecording) {
        updateChecklistMutation.mutate({ isRecording: true })
      }
    }
  }, [])

  const stopRecordingHandler = () => {
    setIsPause((prev) => true)
    setIsReset((prev) => true)
    pause()
    stopRecording()
    setIsComplete((prev) => true)
    if (userData && !userData.checklist.completeRecording) {
      updateChecklistMutation.mutate({ completeRecording: true })
    }
  }

  const downloadRecordingHandler = () => {
    const a = document.createElement('a')
    a.href = mediaBlobUrl || ''
    a.download = `[아이백_녹음유언장]${format(today.toString()).toString()}.wav` // filename
    a.click()
    if (window.navigator.userAgent.includes('iPhone')) {
      createRecordMutation.mutate({ type: 'iphone' })
    } else if (window.navigator.userAgent.includes('Android')) {
      createRecordMutation.mutate({ type: 'android' })
    } else {
      createRecordMutation.mutate({ type: 'pc' })
    }
    setIsDownload(true)
  }

  const createRecordMutation = useMutation((data: CreateRecord) => RecordService.create(data), {
    onSuccess: () => {
      console.log('true')
    },
  })

  const incrementHandler = useCallback(() => {
    setPageIndex((prev) => prev + 1)
  }, [setPageIndex])

  const decrementHandler = useCallback(() => {
    setPageIndex((prev) => prev - 1)
  }, [setPageIndex])

  const updateChecklistMutation = useMutation(
    (data: UpdateChecklist) => ChecklistService.update(userData && userData.checklist.uuid, data),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries('users/me')
      },
    },
  )

  if (isLoading) return <div></div>
  if (error) return <div>error</div>

  if (autoCompleteData) {
    will.push(autoCompleteData.myself)

    if (autoCompleteData.asset.bank) {
      will.push(...autoCompleteData.asset.bank)
    }
    if (autoCompleteData.asset.car) {
      will.push(...autoCompleteData.asset.car)
    }
    if (autoCompleteData.asset.insurance) {
      will.push(...autoCompleteData.asset.insurance)
    }
    if (autoCompleteData.asset.liability) {
      will.push(...autoCompleteData.asset.liability)
    }
    if (autoCompleteData.asset.realty) {
      will.push(...autoCompleteData.asset.realty)
    }
    if (autoCompleteData.asset.security) {
      will.push(...autoCompleteData.asset.security)
    }
    if (autoCompleteData.story.length) {
      will.push(...autoCompleteData.story['legacy'])
    }
    will.push(autoCompleteData.witness)
  }

  return (
    <div>
      <CenterHeader
        title="녹음 유언 작성"
        exit={true}
        onClick={() => {
          navigate('/will')
        }}
      />
      <div className="m-4 relative">
        <div className="bg-white flex relative flex-col h-[126px] border border-zinc-200 rounded-lg p-4 mb-2">
          <div className=" absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 animate-pulse rounded-full bg-iback-light flex items-center justify-center">
              <WillMicOnIcon className=" " />
            </div>
          </div>
          <div className="h-[100px]"></div>
          <div className="flex items-center">
            <div className="bg-[#FF0000] w-3 h-3 rounded-full mr-2"></div>
            <Text
              text="녹음 중"
              textSize={TextSize.S14}
              className="text-iback-primary font-medium mr-3"
            />
            <Stopwatch isStart={isStart} isPause={isPause} isReset={isReset} />
          </div>
        </div>

        <div className="bg-white p-4 border border-zinc-200 rounded-lg ">
          <div className="flex text-[#787878] space-x-1">
            <Text text={`${userData && userData.name}님,`} textSize={TextSize.S14} className="" />
            <Text text="아래 내용을 천천히 또박또박 읽어주세요." textSize={TextSize.S14} />
          </div>

          <div className="my-4 h-[180px] overflow-y-scroll space-y-1">
            <Text textSize={textSizeState} text={`${will.length > 0 && will[pageIndex]}`} />
          </div>

          <div className="flex justify-between items-end">
            <Text
              className="text-[#5F5C5D]"
              textSize={TextSize.S14}
              text={`${(pageIndex + 1).toString().padStart(2, '0')}/${will.length
                .toString()
                .padStart(2, '0')}`}
            />
            <div></div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6 my-4">
          {pageIndex === 0 && (
            <div className="flex justify-end w-full relative">
              <button
                onClick={() => {
                  incrementHandler()
                }}
                className="text-iback-primary  bg-iback-light rounded-full px-4 py-2">
                다음으로 넘어가기
              </button>
              {isModal && (
                <WillTextModal02
                  className=" absolute -top-[50px] right-1"
                  onClick={() => {
                    setIsModal(false)
                  }}
                />
              )}
            </div>
          )}
          {pageIndex > 0 && pageIndex + 1 < will.length && (
            <div className="flex items-center justify-between w-full">
              <WillBackIcon
                onClick={() => {
                  decrementHandler()
                }}
                className=" cursor-pointer"
              />
              <button
                onClick={() => {
                  incrementHandler()
                }}
                className="text-iback-primary  bg-iback-light rounded-full px-4 py-2">
                다음으로 넘어가기
              </button>
            </div>
          )}

          {pageIndex + 1 === will.length && (
            <div className="flex justify-end items-center w-full">
              <button
                onClick={() => {
                  setIsCompleteModal(true)
                }}
                className="bg-iback-primary  text-white  rounded-full px-4 py-2">
                녹음유언 마치기
              </button>
            </div>
          )}
        </div>
      </div>
      {isComplete && (
        <div className=" absolute inset-0 z-20 bg-[#F9F9FA]">
          <Complete
            seconds={seconds}
            minutes={minutes}
            onDownloanRecording={() => downloadRecordingHandler()}
            audioUrl={mediaBlobUrl || ''}
            isDownload={isDownload}
          />
        </div>
      )}
      {isWitness && (
        <ReadWitnessModal
          onClick={() => {
            setIsWitness(false)
          }}
        />
      )}
      {isCompleteModal && (
        <CompleteModal
          onClose={() => {
            setIsCompleteModal(false)
          }}
          onNext={() => {
            setIsCompleteModal(false)
            stopRecordingHandler()
          }}
        />
      )}
    </div>
  )
}
