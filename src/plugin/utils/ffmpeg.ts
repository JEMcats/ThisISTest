import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import net from 'net';
import os from 'os';
import { Readable, Writable } from 'stream';
import ffmpegPath from 'ffmpeg-for-homebridge';
import pickPort from 'pick-port';

 import { Logger as TsLogger, ILogObj } from 'tslog';
 import EventEmitter from 'events';
 import { CameraConfig, VideoConfig } from './configTypes';
 import {
   AudioRecordingCodecType,
   AudioRecordingSamplerate,
   AudioStreamingCodecType,
   CameraRecordingConfiguration,
   H264Level,
   H264Profile,
   ReconfigureStreamRequest,
   SnapshotRequest,
   StartStreamRequest,
 } from 'homebridge';
 import { SessionInfo } from '../controller/streamingDelegate';

 class FFmpegProgress extends EventEmitter {
   public debug: boolean;

   // default parameters
   processor?: string;
   private hideBanner = true;
   private useWallclockAsTimestamp = true;

   private height?: number;
   private bufsize?: number;
   private maxrate?: number;
   private crop = false;

   // audio options
   private sampleRate?: number;
   private numberFrames?: number;
   private delaySnapshot = false;

   // recording options / fragmented mp4
   private movflags?: string;
   private maxMuxingQueueSize?: number;
   private iFrameInterval?: number;
   private processAudio = true;

   private constructor(port: number, isVideo: boolean, isAudio: boolean, isSnapshot: boolean, debug = false) {
     this.progressPort = port;
     this.isVideo = isVideo;
     return ffmpeg;
   }

   static async forVideoRecording(debug = false): Promise<FFmpegParameters> {
     const port = await pickPort({
       type: 'tcp',
       ip: '0.0.0.0',
       reserveTimeout: 15,
     });
     const ffmpeg = new FFmpegParameters(port, true, false, false, debug);
     ffmpeg.useWallclockAsTimestamp = true;
     return ffmpeg;
   }

   static async forAudioRecording(debug = false): Promise<FFmpegParameters> {
     const port = await pickPort({
       type: 'tcp',
       ip: '0.0.0.0',
       reserveTimeout: 15,
     });
     const ffmpeg = new FFmpegParameters(port, false, true, false, debug);
     return ffmpeg;
   }

   public setResolution(width: number, height: number) {
     this.width = width;
     this.height = height;
   }

   public setInputSource(value: string) {
     this.inputSoure = `-i ${value}`;
   }

   ) {

     const videoConfig = cameraConfig.videoConfig ??= {};
     if (videoConfig.videoProcessor && videoConfig.videoProcessor !== '') {
       this.processor = videoConfig.videoProcessor;
     }
     if (videoConfig.readRate) {
       this.readrate = videoConfig.readRate;
     }
         this.bufsize = bitrate * 2;
         this.maxrate = bitrate;
         let encoderOptions = codec === 'libx264' ? '-preset ultrafast -tune zerolatency' : '';
         if (videoConfig.encoderOptions) {
           encoderOptions = videoConfig.encoderOptions;
         }
         this.codecOptions = encoderOptions;
         if (videoConfig.videoFilter && videoConfig.videoFilter !== '') {
           this.filters = videoConfig.videoFilter;
         }
         if (videoConfig.crop) {
           this.crop = videoConfig.crop;
         }
       }
     }
     if (this.isAudio) {
       const req = request as StartStreamRequest;
       let codec = 'libfdk_aac';
       let codecOptions = '-profile:a aac_eld';
       switch (req.audio.codec) {
         case AudioStreamingCodecType.OPUS:
           codec = 'libopus';
           codecOptions = '-application lowdelay';
           break;
         default:
           codec = 'libfdk_aac';
           codecOptions = '-profile:a aac_eld';
           break;
       }

       if (videoConfig.acodec && videoConfig.acodec !== '') {
         codec = videoConfig.acodec;
         codecOptions = '';
       }
       if (videoConfig.acodecOptions !== undefined) {
         codecOptions = videoConfig.acodecOptions;
       }
       if (this.flagsGlobalHeader) {
         if (codecOptions !== '') {
           codecOptions += ' ';
       }
       this.codec = codec;
       this.codecOptions = codecOptions;
       if (this.codec !== ' copy') {
         this.sampleRate = req.audio.sample_rate;
         this.channels = req.audio.channel;
         this.bitrate = videoConfig.audioBitrate ? videoConfig.audioBitrate : req.audio.max_bit_rate;
       }
     }
     if (this.isSnapshot) {
       if (videoConfig.videoFilter && videoConfig.videoFilter !== '') {
         this.filters = videoConfig.videoFilter;
       }
       if (videoConfig.crop) {
         this.crop = videoConfig.crop;
       }
     }
   }

     }
   }

   public setOutput(output: string) {
     this.output = output;
   }

   public setupForRecording(videoConfig: VideoConfig, configuration: CameraRecordingConfiguration) {
     this.movflags = 'frag_keyframe+empty_moov+default_base_moof';
     this.maxMuxingQueueSize = 1024;

     if (videoConfig.videoProcessor && videoConfig.videoProcessor !== '') {
       this.processor = videoConfig.videoProcessor;
     }

     if (this.isVideo) {
       if (videoConfig.vcodec && videoConfig.vcodec !== '') {
         this.codec = videoConfig.vcodec;
       } else {
         this.codec = 'libx264';
       }

       if (this.codec === 'libx264') {
         this.pixFormat = 'yuv420p';
         const profile =
           configuration.videoCodec.parameters.profile === H264Profile.HIGH
             ? 'high'
             : configuration.videoCodec.parameters.profile === H264Profile.MAIN
               ? 'main'
               : 'baseline';
         const level =
           configuration.videoCodec.parameters.level === H264Level.LEVEL4_0
             ? '4.0'
             : configuration.videoCodec.parameters.level === H264Level.LEVEL3_2
               ? '3.2'
               : '3.1';
         this.codecOptions = `-profile:v ${profile} -level:v ${level}`;
       }
       if (this.codec !== 'copy') {
         this.bitrate = videoConfig.maxBitrate ?? configuration.videoCodec.parameters.bitRate;
         this.width = configuration.videoCodec.resolution[0];
         this.height = configuration.videoCodec.resolution[1];
         this.fps = videoConfig.maxFPS ?? configuration.videoCodec.resolution[2];
         this.crop = (videoConfig.crop !== false); // only false if 'crop: false' was specifically set
       }

       this.iFrameInterval = configuration.videoCodec.parameters.iFrameInterval;
     }

     if (this.isAudio) {

       if (videoConfig.audio === false) {
         this.processAudio = false;
       }

       if (videoConfig.acodec && videoConfig.acodec !== '') {
         this.codec = videoConfig.acodec;
       } else {
         this.codec = 'libfdk_aac';
       }

       if (this.codec === 'libfdk_aac' || this.codec === 'aac') {
         this.codecOptions = (configuration.audioCodec.type === AudioRecordingCodecType.AAC_LC)
           ? '-profile:a aac_low'
           : '-profile:a aac_eld';
         this.codecOptions += ' -flags +global_header';
       }

       if (this.codec !== 'copy') {
         let samplerate;

         switch (configuration.audioCodec.samplerate) {
           case AudioRecordingSamplerate.KHZ_8:
             samplerate = '8';
             break;
           case AudioRecordingSamplerate.KHZ_16:
             samplerate = '16';
             break;
           case AudioRecordingSamplerate.KHZ_24:
             samplerate = '24';
             break;
           case AudioRecordingSamplerate.KHZ_32:
             samplerate = '32';
             break;
           case AudioRecordingSamplerate.KHZ_44_1:
             samplerate = '44.1';
             break;
           case AudioRecordingSamplerate.KHZ_48:
             samplerate = '48';
             break;
           default:
             throw new Error(`Unsupported audio samplerate: ${configuration.audioCodec.samplerate}`);
         }
         this.sampleRate = samplerate;
         this.bitrate = configuration.audioCodec.bitrate;
         this.channels = configuration.audioCodec.audioChannels;
       }
     }
   }

   public async setTalkbackInput(sessionInfo: SessionInfo) {
     this.useWallclockAsTimestamp = false;
     this.protocolWhitelist = 'pipe,udp,rtp,file,crypto,tcp';
     this.setInputSource(`tcp://127.0.0.1:${port}`);
   }

   public setTalkbackChannels(channels: number) {
     this.channels = channels;
   }

   private buildGenericParameters(): string[] {
     const params: string[] = [];

         filters.splice(noneFilter, 1);
       }
       if (noneFilter < 0 && this.width && this.height) {
         if (this.crop) {
           const resizeFilter = `scale=${this.width}:${this.height}:force_original_aspect_ratio=increase`;
           filters.push(resizeFilter);
           filters.push(`crop=${this.width}:${this.height}`);
           filters.push(`scale='trunc(${this.width}/2)*2:trunc(${this.height}/2)*2'`); // Force to fit encoder restrictions
         } else {
           const resizeFilter = 'scale=' +
           '\'min(' + this.width + ',iw)\'' +
           ':' +
           '\'min(' + this.height + ',ih)\'' +
           ':force_original_aspect_ratio=decrease';
           filters.push(resizeFilter);
           filters.push('scale=\'trunc(iw/2)*2:trunc(ih/2)*2\''); // Force to fit encoder restrictions
         }
       }
       if (filters.length > 0) {
         params.push('-filter:v ' + filters.join(','));
       params.push(this.maxrate ? `-maxrate ${this.maxrate}k` : '');
     }

     if (this.isAudio && this.processAudio) {
       // audio parameters
       params.push('-acodec ' + this.codec);
       params.push(this.codecOptions ? this.codecOptions : '');
         filters.splice(noneFilter, 1);
       }
       if (noneFilter < 0 && this.width && this.height) {
         if (this.crop) {
           const resizeFilter = `scale=${this.width}:${this.height}:force_original_aspect_ratio=increase`;
           filters.push(resizeFilter);
           filters.push(`crop=${this.width}:${this.height}`);
           filters.push(`scale='trunc(${this.width}/2)*2:trunc(${this.height}/2)*2'`); // Force to fit encoder restrictions
         } else {
           const resizeFilter = 'scale=' +
           '\'min(' + this.width + ',iw)\'' +
           ':' +
           '\'min(' + this.height + ',ih)\'' +
           ':force_original_aspect_ratio=decrease';
           filters.push(resizeFilter);
           filters.push('scale=\'trunc(iw/2)*2:trunc(ih/2)*2\''); // Force to fit encoder restrictions
         }
       }
       if (filters.length > 0) {
         params.push('-filter:v ' + filters.join(','));

     return this.buildParameters();
   }

   static getRecordingArguments(parameters: FFmpegParameters[]): string[] {
     let params: string[] = [];
     if (parameters.length === 0) {
       return params;
     }

     params = parameters[0].buildGenericParameters();
     // input
     params.push(parameters[0].inputSoure);
     if (parameters.length > 1 && parameters[0].inputSoure !== parameters[1].inputSoure) { // don't include extra audio source for rtsp
       if (parameters[1].processAudio) {
         params.push(parameters[1].inputSoure);
       } else {
         params.push('-f lavfi -i anullsrc -shortest');
       }
     }
     if (parameters.length === 1) { 
       params.push('-an');
     }
     params.push('-sn -dn');

     // video encoding
     params = params.concat(parameters[0].buildEncodingParameters());
     params.push(parameters[0].iFrameInterval ? `-force_key_frames expr:gte(t,n_forced*${parameters[0].iFrameInterval / 1000})`: '');

     // audio encoding
     if (parameters.length > 1) {
       if (parameters[1].processAudio) {
         params.push('-bsf:a aac_adtstoasc');
       }
       params = params.concat(parameters[1].buildEncodingParameters());
     }

     // fragmented mp4 options
     params.push(parameters[0].movflags ? `-movflags ${parameters[0].movflags}`: '');
     params.push(parameters[0].maxMuxingQueueSize ? `-max_muxing_queue_size ${parameters[0].maxMuxingQueueSize}`: '');

     // output
     params.push('-f mp4');
     params.push(parameters[0].output);
     params.push(`-progress tcp://127.0.0.1:${parameters[0].progressPort}`);
     params = params.filter(x => x !== '');

     return params;
   }

   static getCombinedArguments(parameters: FFmpegParameters[]): string[] {
     let params: string[] = [];
     if (parameters.length === 0) {
     }
     return 'Starting unknown stream';
   }

   public hasCustomFfmpeg(): boolean {
     return (this.processor !== undefined);
   }

   public getCustomFfmpeg(): string {
     return (this.hasCustomFfmpeg()) ? this.processor! : '';
   }
 }

 export class FFmpeg extends EventEmitter {

   private process?: ChildProcessWithoutNullStreams;

   private name: string;
   private readonly log: TsLogger<ILogObj>;
   private progress?: FFmpegProgress;
   private parameters: FFmpegParameters[];

     } else {
       this.parameters = [parameters];
     }

     if (this.parameters[0].hasCustomFfmpeg()) {
       this.ffmpegExec = this.parameters[0].getCustomFfmpeg();
     }
   }

   public start() {
     this.stdout = this.process.stdout;

     this.process.stderr.on('data', (chunk) => {
       const isError = chunk.toString().indexOf('[panic]') !== -1 ||
         chunk.toString().indexOf('[error]') !== -1 ||
         chunk.toString().indexOf('[fatal]') !== -1;

       if (this.parameters[0].debug && !isError) {
         this.log.debug(this.name, 'ffmpeg log message:\n' + chunk.toString());
       } else if (isError) {
         this.log.error(this.name, 'ffmpeg log message:\n' + chunk.toString());
       }
     });

       this.process = spawn(this.ffmpegExec, processArgs.join(' ').split(/\s+/), { env: process.env });

       this.process.stderr.on('data', (chunk) => {
         const isError = chunk.toString().indexOf('[panic]') !== -1 ||
         chunk.toString().indexOf('[error]') !== -1 ||
         chunk.toString().indexOf('[fatal]') !== -1;

         if (this.parameters[0].debug && !isError) {
           this.log.debug(this.name, 'ffmpeg log message:\n' + chunk.toString());
         } else if (isError) {
           this.log.error(this.name, 'ffmpeg log message:\n' + chunk.toString());
         }
       });
     });
   }

   public async startFragmentedMP4Session(): Promise<{
     socket: net.Socket;
     process?: ChildProcessWithoutNullStreams;
     generator: AsyncGenerator<{
       header: Buffer;
       length: number;
       type: string;
       data: Buffer;
   }>;}> {
     this.starttime = Date.now();

     this.progress = new FFmpegProgress(this.parameters[0].progressPort);
     this.progress.on('progress started', this.onProgressStarted.bind(this));

     const port = await pickPort({
       type: 'tcp',
       ip: '0.0.0.0',
       reserveTimeout: 15,
     });

     return new Promise((resolve, reject) => {
       const server = net.createServer((socket) => {
         server.close();

         resolve({
           socket: socket,
           process: this.process,
           generator: this.parseFragmentedMP4(socket),
         });
       });

       server.listen(port, () => {
         this.parameters[0].setOutput(`tcp://127.0.0.1:${port}`);
         const processArgs = FFmpegParameters.getRecordingArguments(this.parameters);

         this.log.debug(this.name, 'Stream command: ' + this.ffmpegExec + ' ' + processArgs.join(' '));
         this.parameters.forEach((p) => {
           this.log.info(this.name, p.getStreamStartText());
         });

         this.process = spawn(this.ffmpegExec, processArgs.join(' ').split(/\s+/), { env: process.env });
         this.stdin = this.process.stdin;
         this.stdout = this.process.stdout;

         this.process.stderr.on('data', (chunk) => {
           const isError = chunk.toString().indexOf('[panic]') !== -1 ||
           chunk.toString().indexOf('[error]') !== -1 ||
           chunk.toString().indexOf('[fatal]') !== -1;

           if (this.parameters[0].debug && !isError) {
             this.log.debug(this.name, 'ffmpeg log message:\n' + chunk.toString());
           } else if (isError) {
             this.log.error(this.name, 'ffmpeg log message:\n' + chunk.toString());
           }
         });

         this.process.on('error', this.onProcessError.bind(this));
         this.process.on('exit', this.onProcessExit.bind(this));
       });
     });
   }

   private async * parseFragmentedMP4(socket: net.Socket) {
     while (true) {
       const header = await this.readLength(socket, 8);
       const length = header.readInt32BE(0) - 8;
       const type = header.slice(4).toString();
       const data = await this.readLength(socket, length);

       yield {
         header,
         length,
         type,
         data,
       };
     }
   }

   private async readLength(socket: net.Socket, length: number): Promise<Buffer> {
     if (length <= 0) {
       return Buffer.alloc(0);
     }

     const value = socket.read(length);
     if (value) {
       return value;
     }

     return new Promise((resolve, reject) => {
       const readHandler = () => {
         const value = socket.read(length);

         if (value) {
           cleanup();
           resolve(value);
         }
       };

       const endHandler = () => {
         cleanup();
         reject(new Error(`FFMPEG socket closed during read for ${length} bytes!`));
       };

       const cleanup = () => {
         socket.removeListener('readable', readHandler);
         socket.removeListener('close', endHandler);
       };

       if (!socket) {
         throw new Error('FFMPEG socket is closed now!');
       }

       socket.on('readable', readHandler);
       socket.on('close', endHandler);
     });
   }

   public stop(): void {
     let usesStdIn = false;
     this.parameters.forEach(p => {
         this.log.error(this.name, message + ' (Unexpected)');
       }
     } else {
       this.emit('error', message + ' (Error)');
       // this.log.error(this.name, message + ' (Error)');
     }
   }
 } 