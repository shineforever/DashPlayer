import { storeGet } from '@/backend/store';
import fs from 'fs';
import RateLimiter from '@/common/utils/RateLimiter';
import StrUtil from '@/common/utils/str-util';
import { Cancelable } from '@/common/interfaces';
import OpenAI from 'openai';

import { z } from 'zod';
import dpLog from '@/backend/ioc/logger';
import { WhisperResponseFormatError } from '@/backend/errors/errors';
import { WhisperResponseVerifySchema } from '@/common/types/video-info';

export interface WhisperResponse {
    language: string;
    duration: number;
    text: string;
    offset: number;
    segments: {
        seek: number;
        start: number;
        end: number;
        text: string;
    }[];
}

class OpenAiWhisperRequest implements Cancelable {
    private readonly file: string;
    private abortController: AbortController | null = null;
    public readonly openAi: OpenAI;

    constructor(openai: OpenAI, file: string) {
        this.file = file;
        this.openAi = openai;
    }

    public static build(openai: OpenAI, file: string): OpenAiWhisperRequest | null {
        const apiKey = storeGet('apiKeys.openAi.key');
        const endpoint = storeGet('apiKeys.openAi.endpoint');
        if (StrUtil.hasBlank(file, apiKey, endpoint)) {
            return null;
        }
        return new OpenAiWhisperRequest(openai, file);
    }

    public async invoke(): Promise<WhisperResponse> {
        this.cancel();
        await RateLimiter.wait('whisper');
        const transcription = await this.doTranscription();
        // 用 zed 校验一下 transcription 是否为 类型 TranscriptionVerbose
        const parseRes = WhisperResponseVerifySchema.safeParse(transcription);
        if (!parseRes.success) {
            // dperror 为什么不匹配
            dpLog.error('Invalid response from OpenAI', parseRes.error.errors);
            throw new WhisperResponseFormatError();
        }
        return {
            language: transcription.language,
            duration: Number(transcription.duration),
            text: transcription.text,
            offset: 0,
            segments: transcription.segments?.map((seg) => ({
                seek: seg.seek,
                start: seg.start,
                end: seg.end,
                text: seg.text
            })) ?? []
        };

    }

    private async doTranscription() {
        this.abortController = new AbortController();
        try {
            return await this.openAi.audio.transcriptions.create({
                file: fs.createReadStream(this.file),
                model: 'whisper-1',
                response_format: 'verbose_json',
                timestamp_granularities: ['segment']
            }, { signal: this.abortController.signal });
        } catch (error) {
            dpLog.error(error);
            throw error;
        }
    }

    public cancel(): void {
        if (this.abortController) {
            this.abortController.abort('Operation canceled by the user');
            this.abortController = null;
        }
    }

}

export default OpenAiWhisperRequest;
