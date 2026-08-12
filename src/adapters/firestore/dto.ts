/**
 * @file Implements the Firestore adapter responsibility for Dto.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

export {
  buildCardCreateDto,
  buildCardUpdateDto,
  mapCardDocument,
} from "@/entities/card/api/firestoreDocument";
export type { CardCreateDto, CardUpdateDto } from "@/entities/card/api/firestoreDocument";
export {
  buildDeckCreateDto,
  buildDeckUpdateDto,
  mapDeckDocument,
} from "@/entities/deck/api/firestoreDocument";
