"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StaysRepository_1 = __importDefault(require("../repositories/StaysRepository"));
const EmailSenderService_1 = __importDefault(require("./EmailSenderService"));
class StaysWorkerService {
    constructor(autoProcess = true) {
        if (autoProcess) {
            this.process();
        }
    }
    process() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getUnprocessedStays();
            yield this.sendEmails();
        });
    }
    getUnprocessedStays() {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = new StaysRepository_1.default();
            this.elements = yield repo.getUnprocessed();
        });
    }
    sendEmails() {
        return __awaiter(this, void 0, void 0, function* () {
            const elements = yield Promise.all(this.elements);
            for (const item of elements) {
                const sender = new EmailSenderService_1.default();
                yield sender.setMessage(item);
                yield sender.sendEmail();
            }
        });
    }
}
exports.default = StaysWorkerService;
//# sourceMappingURL=StaysWorkerService.js.map