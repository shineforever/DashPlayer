import path from 'path';
import { storeGet, storeSet } from '@/backend/store';
import { app } from 'electron';
import StrUtil from '@/common/utils/str-util';
import LocationService, { LocationType, ProgramType } from '@/backend/services/LocationService';
import { injectable } from 'inversify';

@injectable()
export default class LocationServiceImpl implements LocationService {
    private static readonly isDev = process.env.NODE_ENV === 'development';

    public static ffmpegPath() {
        return this.isDev ? path.resolve('lib/ffmpeg') : `${process.resourcesPath}/lib/ffmpeg`;
    }

    public static ffprobePath() {
        return this.isDev ? path.resolve('lib/ffprobe') : `${process.resourcesPath}/lib/ffprobe`;
    }

    public static ytDlPath() {
        return this.isDev ? path.resolve('lib/yt-dlp') : `${process.resourcesPath}/lib/yt-dlp`;
    }

    public static libPath() {
        return this.isDev ? path.resolve('lib') : `${process.resourcesPath}/lib`;
    }

    public static scriptPath() {
        return this.isDev ? path.resolve('scripts') : `${process.resourcesPath}/scripts`;
    }

    public static getStoragePath(type: LocationType) {
        const basePath = this.getStorageBathPath();
        return path.join(basePath, type);
    }

    private static getStorageBathPath() {
        const p = storeGet('storage.path');
        if (StrUtil.isBlank(p)) {
            const documentsPath = app.getPath('documents');
            const storagePath = path.join(documentsPath, 'DashPlayer');
            storeSet('storage.path', storagePath);
            return storagePath;
        }
        return p;
    }

    getStoragePath(type: LocationType): string {
        return LocationServiceImpl.getStoragePath(type);
    }

    getProgramPath(type: ProgramType): string {
        switch (type) {
            case ProgramType.FFMPEG:
                return LocationServiceImpl.ffmpegPath();
            case ProgramType.FFPROBE:
                return LocationServiceImpl.ffprobePath();
            case ProgramType.YT_DL:
                return LocationServiceImpl.ytDlPath();
            case ProgramType.LIB:
                return LocationServiceImpl.libPath();
            default:
                return '';
        }
    }
}
