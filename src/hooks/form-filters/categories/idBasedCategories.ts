
import { PokemonFormType } from "../types";

// ID-based Pokemon categorization - more reliable than name matching
export const pokemonCategoriesByID: Record<number, PokemonFormType> = {
  // Normal Pokemon (IDs 1-1025 and their base forms)
  // Generation 1 (1-151)
  1: "normal", 2: "normal", 3: "normal", 4: "normal", 5: "normal", 6: "normal", 7: "normal", 8: "normal", 9: "normal", 10: "normal",
  11: "normal", 12: "normal", 13: "normal", 14: "normal", 15: "normal", 16: "normal", 17: "normal", 18: "normal", 19: "normal", 20: "normal",
  21: "normal", 22: "normal", 23: "normal", 24: "normal", 25: "normal", 26: "normal", 27: "normal", 28: "normal", 29: "normal", 30: "normal",
  31: "normal", 32: "normal", 33: "normal", 34: "normal", 35: "normal", 36: "normal", 37: "normal", 38: "normal", 39: "normal", 40: "normal",
  41: "normal", 42: "normal", 43: "normal", 44: "normal", 45: "normal", 46: "normal", 47: "normal", 48: "normal", 49: "normal", 50: "normal",
  51: "normal", 52: "normal", 53: "normal", 54: "normal", 55: "normal", 56: "normal", 57: "normal", 58: "normal", 59: "normal", 60: "normal",
  61: "normal", 62: "normal", 63: "normal", 64: "normal", 65: "normal", 66: "normal", 67: "normal", 68: "normal", 69: "normal", 70: "normal",
  71: "normal", 72: "normal", 73: "normal", 74: "normal", 75: "normal", 76: "normal", 77: "normal", 78: "normal", 79: "normal", 80: "normal",
  81: "normal", 82: "normal", 83: "normal", 84: "normal", 85: "normal", 86: "normal", 87: "normal", 88: "normal", 89: "normal", 90: "normal",
  91: "normal", 92: "normal", 93: "normal", 94: "normal", 95: "normal", 96: "normal", 97: "normal", 98: "normal", 99: "normal", 100: "normal",
  101: "normal", 102: "normal", 103: "normal", 104: "normal", 105: "normal", 106: "normal", 107: "normal", 108: "normal", 109: "normal", 110: "normal",
  111: "normal", 112: "normal", 113: "normal", 114: "normal", 115: "normal", 116: "normal", 117: "normal", 118: "normal", 119: "normal", 120: "normal",
  121: "normal", 122: "normal", 123: "normal", 124: "normal", 125: "normal", 126: "normal", 127: "normal", 128: "normal", 129: "normal", 130: "normal",
  131: "normal", 132: "normal", 133: "normal", 134: "normal", 135: "normal", 136: "normal", 137: "normal", 138: "normal", 139: "normal", 140: "normal",
  141: "normal", 142: "normal", 143: "normal", 144: "normal", 145: "normal", 146: "normal", 147: "normal", 148: "normal", 149: "normal", 150: "normal", 151: "normal",

  // Generation 2 (152-251)
  152: "normal", 153: "normal", 154: "normal", 155: "normal", 156: "normal", 157: "normal", 158: "normal", 159: "normal", 160: "normal", 161: "normal",
  162: "normal", 163: "normal", 164: "normal", 165: "normal", 166: "normal", 167: "normal", 168: "normal", 169: "normal", 170: "normal", 171: "normal",
  172: "normal", 173: "normal", 174: "normal", 175: "normal", 176: "normal", 177: "normal", 178: "normal", 179: "normal", 180: "normal", 181: "normal",
  182: "normal", 183: "normal", 184: "normal", 185: "normal", 186: "normal", 187: "normal", 188: "normal", 189: "normal", 190: "normal", 191: "normal",
  192: "normal", 193: "normal", 194: "normal", 195: "normal", 196: "normal", 197: "normal", 198: "normal", 199: "normal", 200: "normal", 201: "normal",
  202: "normal", 203: "normal", 204: "normal", 205: "normal", 206: "normal", 207: "normal", 208: "normal", 209: "normal", 210: "normal", 211: "normal",
  212: "normal", 213: "normal", 214: "normal", 215: "normal", 216: "normal", 217: "normal", 218: "normal", 219: "normal", 220: "normal", 221: "normal",
  222: "normal", 223: "normal", 224: "normal", 225: "normal", 226: "normal", 227: "normal", 228: "normal", 229: "normal", 230: "normal", 231: "normal",
  232: "normal", 233: "normal", 234: "normal", 235: "normal", 236: "normal", 237: "normal", 238: "normal", 239: "normal", 240: "normal", 241: "normal",
  242: "normal", 243: "normal", 244: "normal", 245: "normal", 246: "normal", 247: "normal", 248: "normal", 249: "normal", 250: "normal", 251: "normal",

  // Generation 3 (252-386)
  252: "normal", 253: "normal", 254: "normal", 255: "normal", 256: "normal", 257: "normal", 258: "normal", 259: "normal", 260: "normal", 261: "normal",
  262: "normal", 263: "normal", 264: "normal", 265: "normal", 266: "normal", 267: "normal", 268: "normal", 269: "normal", 270: "normal", 271: "normal",
  272: "normal", 273: "normal", 274: "normal", 275: "normal", 276: "normal", 277: "normal", 278: "normal", 279: "normal", 280: "normal", 281: "normal",
  282: "normal", 283: "normal", 284: "normal", 285: "normal", 286: "normal", 287: "normal", 288: "normal", 289: "normal", 290: "normal", 291: "normal",
  292: "normal", 293: "normal", 294: "normal", 295: "normal", 296: "normal", 297: "normal", 298: "normal", 299: "normal", 300: "normal", 301: "normal",
  302: "normal", 303: "normal", 304: "normal", 305: "normal", 306: "normal", 307: "normal", 308: "normal", 309: "normal", 310: "normal", 311: "normal",
  312: "normal", 313: "normal", 314: "normal", 315: "normal", 316: "normal", 317: "normal", 318: "normal", 319: "normal", 320: "normal", 321: "normal",
  322: "normal", 323: "normal", 324: "normal", 325: "normal", 326: "normal", 327: "normal", 328: "normal", 329: "normal", 330: "normal", 331: "normal",
  332: "normal", 333: "normal", 334: "normal", 335: "normal", 336: "normal", 337: "normal", 338: "normal", 339: "normal", 340: "normal", 341: "normal",
  342: "normal", 343: "normal", 344: "normal", 345: "normal", 346: "normal", 347: "normal", 348: "normal", 349: "normal", 350: "normal", 351: "normal",
  352: "normal", 353: "normal", 354: "normal", 355: "normal", 356: "normal", 357: "normal", 358: "normal", 359: "normal", 360: "normal", 361: "normal",
  362: "normal", 363: "normal", 364: "normal", 365: "normal", 366: "normal", 367: "normal", 368: "normal", 369: "normal", 370: "normal", 371: "normal",
  372: "normal", 373: "normal", 374: "normal", 375: "normal", 376: "normal", 377: "normal", 378: "normal", 379: "normal", 380: "normal", 381: "normal",
  382: "normal", 383: "normal", 384: "normal", 385: "normal", 386: "normal",

  // Generation 4 (387-493)
  387: "normal", 388: "normal", 389: "normal", 390: "normal", 391: "normal", 392: "normal", 393: "normal", 394: "normal", 395: "normal", 396: "normal",
  397: "normal", 398: "normal", 399: "normal", 400: "normal", 401: "normal", 402: "normal", 403: "normal", 404: "normal", 405: "normal", 406: "normal",
  407: "normal", 408: "normal", 409: "normal", 410: "normal", 411: "normal", 412: "normal", 413: "normal", 414: "normal", 415: "normal", 416: "normal",
  417: "normal", 418: "normal", 419: "normal", 420: "normal", 421: "normal", 422: "normal", 423: "normal", 424: "normal", 425: "normal", 426: "normal",
  427: "normal", 428: "normal", 429: "normal", 430: "normal", 431: "normal", 432: "normal", 433: "normal", 434: "normal", 435: "normal", 436: "normal",
  437: "normal", 438: "normal", 439: "normal", 440: "normal", 441: "normal", 442: "normal", 443: "normal", 444: "normal", 445: "normal", 446: "normal",
  447: "normal", 448: "normal", 449: "normal", 450: "normal", 451: "normal", 452: "normal", 453: "normal", 454: "normal", 455: "normal", 456: "normal",
  457: "normal", 458: "normal", 459: "normal", 460: "normal", 461: "normal", 462: "normal", 463: "normal", 464: "normal", 465: "normal", 466: "normal",
  467: "normal", 468: "normal", 469: "normal", 470: "normal", 471: "normal", 472: "normal", 473: "normal", 474: "normal", 475: "normal", 476: "normal",
  477: "normal", 478: "normal", 479: "normal", 480: "normal", 481: "normal", 482: "normal", 483: "normal", 484: "normal", 485: "normal", 486: "normal",
  487: "normal", 488: "normal", 489: "normal", 490: "normal", 491: "normal", 492: "normal", 493: "normal",

  // Generation 5 (494-649)
  494: "normal", 495: "normal", 496: "normal", 497: "normal", 498: "normal", 499: "normal", 500: "normal", 501: "normal", 502: "normal", 503: "normal",
  504: "normal", 505: "normal", 506: "normal", 507: "normal", 508: "normal", 509: "normal", 510: "normal", 511: "normal", 512: "normal", 513: "normal",
  514: "normal", 515: "normal", 516: "normal", 517: "normal", 518: "normal", 519: "normal", 520: "normal", 521: "normal", 522: "normal", 523: "normal",
  524: "normal", 525: "normal", 526: "normal", 527: "normal", 528: "normal", 529: "normal", 530: "normal", 531: "normal", 532: "normal", 533: "normal",
  534: "normal", 535: "normal", 536: "normal", 537: "normal", 538: "normal", 539: "normal", 540: "normal", 541: "normal", 542: "normal", 543: "normal",
  544: "normal", 545: "normal", 546: "normal", 547: "normal", 548: "normal", 549: "normal", 550: "normal", 551: "normal", 552: "normal", 553: "normal",
  554: "normal", 555: "normal", 556: "normal", 557: "normal", 558: "normal", 559: "normal", 560: "normal", 561: "normal", 562: "normal", 563: "normal",
  564: "normal", 565: "normal", 566: "normal", 567: "normal", 568: "normal", 569: "normal", 570: "normal", 571: "normal", 572: "normal", 573: "normal",
  574: "normal", 575: "normal", 576: "normal", 577: "normal", 578: "normal", 579: "normal", 580: "normal", 581: "normal", 582: "normal", 583: "normal",
  584: "normal", 585: "normal", 586: "normal", 587: "normal", 588: "normal", 589: "normal", 590: "normal", 591: "normal", 592: "normal", 593: "normal",
  594: "normal", 595: "normal", 596: "normal", 597: "normal", 598: "normal", 599: "normal", 600: "normal", 601: "normal", 602: "normal", 603: "normal",
  604: "normal", 605: "normal", 606: "normal", 607: "normal", 608: "normal", 609: "normal", 610: "normal", 611: "normal", 612: "normal", 613: "normal",
  614: "normal", 615: "normal", 616: "normal", 617: "normal", 618: "normal", 619: "normal", 620: "normal", 621: "normal", 622: "normal", 623: "normal",
  624: "normal", 625: "normal", 626: "normal", 627: "normal", 628: "normal", 629: "normal", 630: "normal", 631: "normal", 632: "normal", 633: "normal",
  634: "normal", 635: "normal", 636: "normal", 637: "normal", 638: "normal", 639: "normal", 640: "normal", 641: "normal", 642: "normal", 643: "normal",
  644: "normal", 645: "normal", 646: "normal", 647: "normal", 648: "normal", 649: "normal",

  // Generation 6 (650-721)
  650: "normal", 651: "normal", 652: "normal", 653: "normal", 654: "normal", 655: "normal", 656: "normal", 657: "normal", 658: "normal", 659: "normal",
  660: "normal", 661: "normal", 662: "normal", 663: "normal", 664: "normal", 665: "normal", 666: "normal", 667: "normal", 668: "normal", 669: "normal",
  670: "normal", 671: "normal", 672: "normal", 673: "normal", 674: "normal", 675: "normal", 676: "normal", 677: "normal", 678: "normal", 679: "normal",
  680: "normal", 681: "normal", 682: "normal", 683: "normal", 684: "normal", 685: "normal", 686: "normal", 687: "normal", 688: "normal", 689: "normal",
  690: "normal", 691: "normal", 692: "normal", 693: "normal", 694: "normal", 695: "normal", 696: "normal", 697: "normal", 698: "normal", 699: "normal",
  700: "normal", 701: "normal", 702: "normal", 703: "normal", 704: "normal", 705: "normal", 706: "normal", 707: "normal", 708: "normal", 709: "normal",
  710: "normal", 711: "normal", 712: "normal", 713: "normal", 714: "normal", 715: "normal", 716: "normal", 717: "normal", 718: "normal", 719: "normal",
  720: "normal", 721: "normal",

  // Generation 7 (722-809)
  722: "normal", 723: "normal", 724: "normal", 725: "normal", 726: "normal", 727: "normal", 728: "normal", 729: "normal", 730: "normal", 731: "normal",
  732: "normal", 733: "normal", 734: "normal", 735: "normal", 736: "normal", 737: "normal", 738: "normal", 739: "normal", 740: "normal", 741: "normal",
  742: "normal", 743: "normal", 744: "normal", 745: "normal", 746: "normal", 747: "normal", 748: "normal", 749: "normal", 750: "normal", 751: "normal",
  752: "normal", 753: "normal", 754: "normal", 755: "normal", 756: "normal", 757: "normal", 758: "normal", 759: "normal", 760: "normal", 761: "normal",
  762: "normal", 763: "normal", 764: "normal", 765: "normal", 766: "normal", 767: "normal", 768: "normal", 769: "normal", 770: "normal", 771: "normal",
  772: "normal", 773: "normal", 774: "normal", 775: "normal", 776: "normal", 777: "normal", 778: "normal", 779: "normal", 780: "normal", 781: "normal",
  782: "normal", 783: "normal", 784: "normal", 785: "normal", 786: "normal", 787: "normal", 788: "normal", 789: "normal", 790: "normal", 791: "normal",
  792: "normal", 793: "normal", 794: "normal", 795: "normal", 796: "normal", 797: "normal", 798: "normal", 799: "normal", 800: "normal", 801: "normal",
  802: "normal", 803: "normal", 804: "normal", 805: "normal", 806: "normal", 807: "normal", 808: "normal", 809: "normal",

  // Generation 8 (810-905)
  810: "normal", 811: "normal", 812: "normal", 813: "normal", 814: "normal", 815: "normal", 816: "normal", 817: "normal", 818: "normal", 819: "normal",
  820: "normal", 821: "normal", 822: "normal", 823: "normal", 824: "normal", 825: "normal", 826: "normal", 827: "normal", 828: "normal", 829: "normal",
  830: "normal", 831: "normal", 832: "normal", 833: "normal", 834: "normal", 835: "normal", 836: "normal", 837: "normal", 838: "normal", 839: "normal",
  840: "normal", 841: "normal", 842: "normal", 843: "normal", 844: "normal", 845: "normal", 846: "normal", 847: "normal", 848: "normal", 849: "normal",
  850: "normal", 851: "normal", 852: "normal", 853: "normal", 854: "normal", 855: "normal", 856: "normal", 857: "normal", 858: "normal", 859: "normal",
  860: "normal", 861: "normal", 862: "normal", 863: "normal", 864: "normal", 865: "normal", 866: "normal", 867: "normal", 868: "normal", 869: "normal",
  870: "normal", 871: "normal", 872: "normal", 873: "normal", 874: "normal", 875: "normal", 876: "normal", 877: "normal", 878: "normal", 879: "normal",
  880: "normal", 881: "normal", 882: "normal", 883: "normal", 884: "normal", 885: "normal", 886: "normal", 887: "normal", 888: "normal", 889: "normal",
  890: "normal", 891: "normal", 892: "normal", 893: "normal", 894: "normal", 895: "normal", 896: "normal", 897: "normal", 898: "normal", 899: "normal",
  900: "normal", 901: "normal", 902: "normal", 903: "normal", 904: "normal", 905: "normal",

  // Generation 9 (906-1025)
  906: "normal", 907: "normal", 908: "normal", 909: "normal", 910: "normal", 911: "normal", 912: "normal", 913: "normal", 914: "normal", 915: "normal",
  916: "normal", 917: "normal", 918: "normal", 919: "normal", 920: "normal", 921: "normal", 922: "normal", 923: "normal", 924: "normal", 925: "normal",
  926: "normal", 927: "normal", 928: "normal", 929: "normal", 930: "normal", 931: "normal", 932: "normal", 933: "normal", 934: "normal", 935: "normal",
  936: "normal", 937: "normal", 938: "normal", 939: "normal", 940: "normal", 941: "normal", 942: "normal", 943: "normal", 944: "normal", 945: "normal",
  946: "normal", 947: "normal", 948: "normal", 949: "normal", 950: "normal", 951: "normal", 952: "normal", 953: "normal", 954: "normal", 955: "normal",
  956: "normal", 957: "normal", 958: "normal", 959: "normal", 960: "normal", 961: "normal", 962: "normal", 963: "normal", 964: "normal", 965: "normal",
  966: "normal", 967: "normal", 968: "normal", 969: "normal", 970: "normal", 971: "normal", 972: "normal", 973: "normal", 974: "normal", 975: "normal",
  976: "normal", 977: "normal", 978: "normal", 979: "normal", 980: "normal", 981: "normal", 982: "normal", 983: "normal", 984: "normal", 985: "normal",
  986: "normal", 987: "normal", 988: "normal", 989: "normal", 990: "normal", 991: "normal", 992: "normal", 993: "normal", 994: "normal", 995: "normal",
  996: "normal", 997: "normal", 998: "normal", 999: "normal", 1000: "normal", 1001: "normal", 1002: "normal", 1003: "normal", 1004: "normal", 1005: "normal",
  1006: "normal", 1007: "normal", 1008: "normal", 1009: "normal", 1010: "normal", 1011: "normal", 1012: "normal", 1013: "normal", 1014: "normal", 1015: "normal",
  1016: "normal", 1017: "normal", 1018: "normal", 1019: "normal", 1020: "normal", 1021: "normal", 1022: "normal", 1023: "normal", 1024: "normal", 1025: "normal",

  // Alternative forms, regional variants, etc. - based on your data
  10001: "forms", // Deoxys-attack
  10002: "forms", // Deoxys-defense  
  10003: "forms", // Deoxys-speed
  10004: "forms", // Wormadam-sandy
  10005: "forms", // Wormadam-trash
  10006: "forms", // Shaymin-sky
  10007: "originPrimal", // Giratina-origin
  10008: "forms", // Rotom-heat
  10009: "forms", // Rotom-wash
  10010: "forms", // Rotom-frost
  10011: "forms", // Rotom-fan
  10012: "forms", // Rotom-mow
  10013: "forms", // Castform-sunny
  10014: "forms", // Castform-rainy
  10015: "forms", // Castform-snowy
  10016: "colorsFlavors", // Basculin-blue-striped
  10017: "forms", // Darmanitan-zen
  10018: "forms", // Meloetta-pirouette
  10019: "forms", // Tornadus-therian
  10020: "forms", // Thundurus-therian
  10021: "forms", // Landorus-therian
  10022: "forms", // Kyurem-black
  10023: "forms", // Kyurem-white
  10024: "forms", // Keldeo-resolute
  10025: "gender", // Meowstic-female
  10026: "forms", // Aegislash-blade
  10027: "blocked", // Pumpkaboo-small
  10028: "blocked", // Pumpkaboo-large
  10029: "blocked", // Pumpkaboo-super
  10030: "blocked", // Gourgeist-small
  10031: "blocked", // Gourgeist-large
  10032: "blocked", // Gourgeist-super

  // Mega forms
  10033: "megaGmax", 10034: "megaGmax", 10035: "megaGmax", 10036: "megaGmax", 10037: "megaGmax", 10038: "megaGmax",
  10039: "megaGmax", 10040: "megaGmax", 10041: "megaGmax", 10042: "megaGmax", 10043: "megaGmax", 10044: "megaGmax",
  10045: "megaGmax", 10046: "megaGmax", 10047: "megaGmax", 10048: "megaGmax", 10049: "megaGmax", 10050: "megaGmax",
  10051: "megaGmax", 10052: "megaGmax", 10053: "megaGmax", 10054: "megaGmax", 10055: "megaGmax", 10056: "megaGmax",
  10057: "megaGmax", 10058: "megaGmax", 10059: "megaGmax", 10060: "megaGmax", 10061: "forms", 10062: "megaGmax",
  10063: "megaGmax", 10064: "megaGmax", 10065: "megaGmax", 10066: "megaGmax", 10067: "megaGmax", 10068: "megaGmax",
  10069: "megaGmax", 10070: "megaGmax", 10071: "megaGmax", 10072: "megaGmax", 10073: "megaGmax", 10074: "megaGmax",
  10075: "megaGmax", 10076: "megaGmax", 10077: "originPrimal", 10078: "originPrimal", 10079: "megaGmax",

  // Pikachu costumes
  10080: "costumes", 10081: "costumes", 10082: "costumes", 10083: "costumes", 10084: "costumes", 10085: "costumes",
  10086: "forms", 10087: "megaGmax", 10088: "megaGmax", 10089: "megaGmax", 10090: "megaGmax",

  // Alolan forms  
  10091: "regional", 10092: "regional", 10093: "blocked", 10094: "costumes", 10095: "costumes", 10096: "costumes",
  10097: "costumes", 10098: "costumes", 10099: "costumes", 10100: "regional", 10101: "regional", 10102: "regional",
  10103: "regional", 10104: "regional", 10105: "regional", 10106: "regional", 10107: "regional", 10108: "regional",
  10109: "regional", 10110: "regional", 10111: "regional", 10112: "regional", 10113: "regional", 10114: "regional",
  10115: "regional", 10116: "blocked", 10117: "forms",

  // More forms
  10118: "forms", 10119: "forms", 10120: "forms", 10121: "blocked", 10122: "blocked", 10123: "forms", 10124: "forms",
  10125: "forms", 10126: "forms", 10127: "forms", 10128: "blocked", 10129: "blocked", 10130: "blocked", 10131: "blocked",
  10132: "blocked", 10133: "blocked", 10134: "blocked", 10135: "blocked", 10136: "colorsFlavors", 10137: "colorsFlavors",
  10138: "colorsFlavors", 10139: "colorsFlavors", 10140: "colorsFlavors", 10141: "colorsFlavors", 10142: "colorsFlavors",
  10143: "forms", 10144: "blocked", 10145: "blocked", 10146: "blocked", 10147: "forms", 10148: "costumes", 10149: "blocked",
  10150: "blocked", 10151: "blocked", 10152: "forms", 10153: "blocked", 10154: "blocked", 10155: "forms", 10156: "forms",
  10157: "forms", 10158: "blocked", 10159: "blocked", 10160: "costumes",

  // Galarian forms
  10161: "regional", 10162: "regional", 10163: "regional", 10164: "regional", 10165: "regional", 10166: "regional",
  10167: "regional", 10168: "regional", 10169: "regional", 10170: "regional", 10171: "regional", 10172: "regional",
  10173: "regional", 10174: "regional", 10175: "regional", 10176: "regional", 10177: "regional", 10178: "forms",
  10179: "regional", 10180: "regional", 10181: "forms", 10182: "blocked", 10183: "blocked", 10184: "forms",
  10185: "forms", 10186: "gender", 10187: "forms", 10188: "forms", 10189: "forms", 10190: "megaGmax", 10191: "forms",
  10192: "forms", 10193: "forms", 10194: "forms",

  // Gigantamax forms
  10195: "megaGmax", 10196: "megaGmax", 10197: "megaGmax", 10198: "megaGmax", 10199: "megaGmax", 10200: "megaGmax",
  10201: "megaGmax", 10202: "megaGmax", 10203: "megaGmax", 10204: "megaGmax", 10205: "megaGmax", 10206: "megaGmax",
  10207: "megaGmax", 10208: "megaGmax", 10209: "megaGmax", 10210: "megaGmax", 10211: "megaGmax", 10212: "megaGmax",
  10213: "megaGmax", 10214: "megaGmax", 10215: "megaGmax", 10216: "megaGmax", 10217: "megaGmax", 10218: "megaGmax",
  10219: "megaGmax", 10220: "megaGmax", 10221: "megaGmax", 10222: "megaGmax", 10223: "megaGmax", 10224: "megaGmax",
  10225: "megaGmax", 10226: "megaGmax", 10227: "megaGmax", 10228: "megaGmax",

  // Hisuian forms
  10229: "regional", 10230: "regional", 10231: "regional", 10232: "regional", 10233: "regional", 10234: "regional",
  10235: "regional", 10236: "regional", 10237: "regional", 10238: "regional", 10239: "regional", 10240: "regional",
  10241: "regional", 10242: "regional", 10243: "regional", 10244: "regional", 10245: "originPrimal", 10246: "originPrimal",
  10247: "colorsFlavors", 10248: "gender", 10249: "forms",

  // Paldean forms and newest Pokemon
  10250: "forms", 10251: "forms", 10252: "forms", 10253: "regional", 10254: "gender", 10255: "forms", 10256: "forms",
  10257: "forms", 10258: "forms", 10259: "forms", 10260: "colorsFlavors", 10261: "colorsFlavors", 10262: "colorsFlavors",
  10263: "forms", 10264: "blocked", 10265: "blocked", 10266: "blocked", 10267: "blocked", 10268: "blocked",
  10269: "blocked", 10270: "blocked", 10271: "blocked", 10272: "forms", 10273: "forms", 10274: "forms",
  10275: "forms", 10276: "forms", 10277: "forms"
};

export const getHardcodedCategoryByID = (pokemonId: number): PokemonFormType | null => {
  return pokemonCategoriesByID[pokemonId] || null;
};
